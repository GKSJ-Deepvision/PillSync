from __future__ import annotations

import io
import re
from pathlib import Path

import joblib
import numpy as np
from PIL import Image

from .features import extract_features, prepare_image
from .vocabulary import get_vocabulary

MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "handwritten_medicine_classifier.joblib"

_DOSE_RE = re.compile(r"(\d{1,4})\s*-?\s*(mg|mcg|ml|g)\b", re.IGNORECASE)
_FREQ_RE = re.compile(r"([01])\D{0,3}([01])\D{0,3}([01])")


class HandwrittenMedicineRecognizer:
    """Classifies a single cropped handwritten word against the closed set
    of medicine names in ``ml/data/raw/ocr_handwritten``.

    The artifact is a dict of ``{"pca": PCA, "classifier": SVC, "classes": [...]}``
    produced by ``train.py``: HOG features are projected through the PCA
    (fit on augmented training data) before being scored by the calibrated
    SVM. See ``ml/README.md`` for accuracy numbers and the honest caveats
    around them.
    """

    def __init__(self, model_path: Path = MODEL_PATH):
        self.artifact = joblib.load(model_path)

    def predict(self, image_bytes: bytes) -> tuple[str, float]:
        return self.predict_top_k(image_bytes, k=1)[0]

    def predict_top_k(self, image_bytes: bytes, k: int = 3) -> list[tuple[str, float]]:
        """Return up to ``k`` (name, confidence) candidates, best first.

        Surfacing more than one candidate matters here: with ~60% top-1 test
        accuracy but ~72% top-3 accuracy, showing the user a short list to
        confirm from is both more honest and safer than silently committing
        to a single guess for something that ends up in a medication log.
        """
        image = prepare_image(Image.open(io.BytesIO(image_bytes)))
        features = extract_features(image).reshape(1, -1)
        features = self.artifact["pca"].transform(features)
        classifier = self.artifact["classifier"]
        probabilities = classifier.predict_proba(features)[0]
        order = np.argsort(probabilities)[::-1][:k]
        return [(str(classifier.classes_[i]), float(probabilities[i])) for i in order]


class PrintedMedicineRecognizer:
    """Extracts medicine names from a photographed/printed prescription.

    This used to be a whole-image pixel classifier trained to guess which of
    10 fixed medicines a prescription photo "looked like" -- it measured
    ~10% accuracy on held-out data because a downsized, flattened image
    simply doesn't carry enough information to read text, and it had no way
    to reject non-medicine content (a doctor's letterhead, "MBBS, MD", etc).

    This replacement actually reads the text (via Tesseract) and only keeps
    lines that fuzzy-match a real medicine name in the shared vocabulary
    (``vocabulary.py``), which is both more accurate and directly addresses
    "don't add anything that isn't actually a medicine".
    """

    def predict(self, image_bytes: bytes) -> list[str]:
        return [entry["medicine"] for entry in self.extract(image_bytes)]

    def extract(self, image_bytes: bytes) -> list[dict]:
        import pytesseract

        image = Image.open(io.BytesIO(image_bytes)).convert("L")
        image = image.resize((image.width * 3, image.height * 3), Image.LANCZOS)
        text = pytesseract.image_to_string(image, config="--psm 6")

        vocabulary = get_vocabulary()
        results = []
        for raw_line in text.splitlines():
            line = raw_line.strip()
            if len(line) < 4:
                continue
            match = vocabulary.match(line)
            if match is None:
                continue
            dose = _DOSE_RE.search(line)
            freq = _FREQ_RE.search(re.sub(r"[^\d\-]", "", line[-12:]))
            results.append(
                {
                    "medicine": match.name,
                    "generic_name": match.generic_name,
                    "confidence": match.score / 100,
                    "dosage": f"{dose.group(1)}{dose.group(2).lower()}" if dose else None,
                    "frequency": f"{freq.group(1)}-{freq.group(2)}-{freq.group(3)}" if freq else None,
                }
            )
        return results
