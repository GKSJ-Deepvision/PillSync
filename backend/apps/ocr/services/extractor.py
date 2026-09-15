from __future__ import annotations

import io
import os
import sys
import shutil
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from ..schemas import OCRResponse
from .parser import parse_prescription_text


MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/tiff", "image/bmp"}


def extract_prescription(image_bytes: bytes) -> OCRResponse:
    import pytesseract

    image = Image.open(io.BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image).convert("L")
    image.thumbnail((2400, 2400))
    image = ImageEnhance.Contrast(ImageOps.autocontrast(image)).enhance(1.5)
    image = image.filter(ImageFilter.SHARPEN)
    recognized_names = _recognize_printed_image(image_bytes)
    try:
        _configure_tesseract(pytesseract)
        text = pytesseract.image_to_string(image, config="--psm 6")
        data = pytesseract.image_to_data(image, config="--psm 6", output_type=pytesseract.Output.DICT)
        values = [float(value) for value in data["conf"] if float(value) >= 0]
        confidence = round(max(0.0, min(1.0, (sum(values) / len(values)) / 100)), 4) if values else 0.0
        recognized_names += _recognize_detected_words(image)
    except (ImportError, OSError):
        text = "\n".join(dict.fromkeys(recognized_names))
        confidence = 0.35 if recognized_names else 0.0

    parsed = parse_prescription_text(text, confidence, recognized_names)
    if not parsed and recognized_names:
        parsed = parse_prescription_text("\n".join(dict.fromkeys(recognized_names)), confidence, recognized_names)
    medicine_text = "\n".join(
        " | ".join(value for value in [medicine.name, medicine.dosage, medicine.frequency, medicine.quantity] if value)
        for medicine in parsed
    )
    engine = "trained-medicine-model" if not text or text == "\n".join(dict.fromkeys(recognized_names)) else "tesseract+trained-medicine-model"
    return OCRResponse(text=medicine_text, medicines=parsed, confidence=confidence, engine=engine)


def _configure_tesseract(pytesseract) -> None:
    configured = os.getenv("TESSERACT_CMD")
    candidates = [
        configured,
        shutil.which("tesseract"),
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    ]
    executable = next((path for path in candidates if path and Path(path).exists()), None)
    if executable:
        pytesseract.pytesseract.tesseract_cmd = executable


def _recognize_printed_image(image_bytes: bytes) -> list[str]:
    model_path = Path(__file__).resolve().parents[4] / "ml" / "models" / "printed_medicine_classifier.joblib"
    if not model_path.exists():
        return []
    try:
        repo_root = model_path.parents[2]
        if str(repo_root) not in sys.path:
            sys.path.insert(0, str(repo_root))
        from ml.src.ocr.recognizer import PrintedMedicineRecognizer
        return PrintedMedicineRecognizer(model_path).predict(image_bytes)
    except Exception:
        return []


def _recognize_detected_words(image: Image.Image) -> list[str]:
    import pytesseract

    model_path = Path(__file__).resolve().parents[4] / "ml" / "models" / "handwritten_medicine_classifier.joblib"
    if not model_path.exists():
        return []
    try:
        repo_root = model_path.parents[2]
        if str(repo_root) not in sys.path:
            sys.path.insert(0, str(repo_root))
        from ml.src.ocr.recognizer import HandwrittenMedicineRecognizer
        recognizer = HandwrittenMedicineRecognizer(model_path)
        data = pytesseract.image_to_data(image, config="--psm 6", output_type=pytesseract.Output.DICT)
        names = []
        for index, raw_text in enumerate(data["text"]):
            if not raw_text.strip() or int(data["width"][index]) < 20:
                continue
            crop = image.crop((data["left"][index], data["top"][index], data["left"][index] + data["width"][index], data["top"][index] + data["height"][index]))
            buffer = io.BytesIO()
            crop.save(buffer, format="PNG")
            name, probability = recognizer.predict(buffer.getvalue())
            if probability >= 0.55:
                names.append(name)
        return names
    except Exception:
        return []


