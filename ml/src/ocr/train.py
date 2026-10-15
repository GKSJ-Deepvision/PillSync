"""Train the handwritten medicine-name recognizer.

Run from the repository root:
    python -m ml.src.ocr.train

Pipeline (see ml/README.md for the full write-up and honest accuracy
numbers): each training word image is augmented ~7x with random rotation,
shear, stroke-thickness, blur, shift and noise (ml/src/ocr/features.py),
turned into a HOG descriptor, projected through a PCA fit on that augmented
set, and classified with a calibrated (probability=True) RBF SVM. The PCA
step is mainly there for speed (~9x faster SVM fitting with no meaningful
accuracy loss) but also acts as mild denoising on the HOG descriptor.

There used to be a second `train_printed()` step here that trained a
whole-image pixel classifier to guess which of 10 medicines a prescription
*photo* looked like. It measured ~10% accuracy and has been removed: reading
the actual text with Tesseract and matching it against the shared medicine
vocabulary (see ``vocabulary.py`` and ``recognizer.PrintedMedicineRecognizer``)
is both simpler and dramatically more accurate, and needs no training step
at all.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path

import joblib
import numpy as np
from PIL import Image
from sklearn.decomposition import PCA
from sklearn.metrics import accuracy_score, top_k_accuracy_score
from sklearn.svm import SVC

from .features import augment, extract_features, prepare_image

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw" / "ocr_handwritten"
MODEL_PATH = ROOT / "models" / "handwritten_medicine_classifier.joblib"
METRICS_PATH = ROOT / "models" / "handwritten_medicine_classifier.metrics.json"

AUGMENTATIONS_PER_IMAGE = 7
PCA_COMPONENTS = 250
SVC_C = 5
SVC_GAMMA = 0.02


def _load_split(name: str) -> list[tuple[Path, str]]:
    split = RAW / name
    label_file = split / f"{name.lower()}_labels.csv"
    image_dir = split / f"{name.lower()}_words"
    if not label_file.exists():
        return []
    with label_file.open(newline="", encoding="utf-8") as handle:
        return [
            (image_dir / row["IMAGE"], row["MEDICINE_NAME"])
            for row in csv.DictReader(handle)
            if (image_dir / row["IMAGE"]).exists()
        ]


def _generic_lookup() -> dict[str, str]:
    lookup: dict[str, str] = {}
    for split in ("Training", "Validation", "Testing"):
        label_file = RAW / split / f"{split.lower()}_labels.csv"
        if not label_file.exists():
            continue
        with label_file.open(newline="", encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                lookup.setdefault(row["MEDICINE_NAME"], row["GENERIC_NAME"])
    return lookup


def _stable_seed(path: Path) -> int:
    """Deterministic per-image seed (Python's hash() is salted per-process,
    which would otherwise make every training run pick different random
    augmentations and produce a slightly different model each time)."""
    return int(hashlib.md5(str(path).encode("utf-8")).hexdigest(), 16) % (2**31)


def _build_training_matrix(items: list[tuple[Path, str]]) -> tuple[np.ndarray, np.ndarray]:
    """HOG features for every training image *plus* its augmented copies."""
    features, labels = [], []
    for path, label in items:
        base = prepare_image(Image.open(path))
        features.append(extract_features(base))
        labels.append(label)
        for variant in augment(base, AUGMENTATIONS_PER_IMAGE, seed=_stable_seed(path)):
            features.append(extract_features(variant))
            labels.append(label)
    return np.asarray(features, dtype=np.float32), np.asarray(labels)


def _build_eval_matrix(items: list[tuple[Path, str]]) -> tuple[np.ndarray, np.ndarray]:
    features = [extract_features(prepare_image(Image.open(path))) for path, _ in items]
    labels = [label for _, label in items]
    return np.asarray(features, dtype=np.float32), np.asarray(labels)


def train() -> dict:
    train_items = _load_split("Training")
    validation_items = _load_split("Validation")
    test_items = _load_split("Testing")
    if not train_items:
        raise RuntimeError(f"No labeled images found under {RAW}")

    train_x, train_y = _build_training_matrix(train_items)
    val_x, val_y = _build_eval_matrix(validation_items)
    test_x, test_y = _build_eval_matrix(test_items)

    pca = PCA(n_components=PCA_COMPONENTS, random_state=42)
    train_x_p = pca.fit_transform(train_x)

    classifier = SVC(
        C=SVC_C,
        kernel="rbf",
        gamma=SVC_GAMMA,
        class_weight="balanced",
        probability=True,
        random_state=42,
    )
    classifier.fit(train_x_p, train_y)

    metrics = {
        "augmented_train_samples": len(train_x),
        "original_train_samples": len(train_items),
        "classes": len(classifier.classes_),
        "train_accuracy": accuracy_score(train_y, classifier.predict(train_x_p)),
    }
    if len(val_x):
        val_x_p = pca.transform(val_x)
        metrics["validation_accuracy"] = accuracy_score(val_y, classifier.predict(val_x_p))
    if len(test_x):
        test_x_p = pca.transform(test_x)
        metrics["test_accuracy"] = accuracy_score(test_y, classifier.predict(test_x_p))
        proba = classifier.predict_proba(test_x_p)
        metrics["test_top3_accuracy"] = top_k_accuracy_score(
            test_y, proba, k=3, labels=classifier.classes_
        )

    artifact = {
        "pca": pca,
        "classifier": classifier,
        "classes": classifier.classes_.tolist(),
        "generic_by_medicine": _generic_lookup(),
        "feature_type": "hog+pca",
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, MODEL_PATH)
    metrics["model"] = str(MODEL_PATH)

    with METRICS_PATH.open("w", encoding="utf-8") as handle:
        json.dump(metrics, handle, indent=2)
    print(json.dumps(metrics, indent=2))
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the handwritten medicine-name OCR classifier")
    parser.parse_args()
    train()
