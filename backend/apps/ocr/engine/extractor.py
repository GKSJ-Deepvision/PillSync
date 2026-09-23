"""
Image -> text + confidence.  Drop into: backend/apps/ocr/services/extractor.py
Requires: tesseract-ocr (system), pytesseract, opencv-python-headless, Pillow
"""

from dataclasses import dataclass

import cv2
import numpy as np
import pytesseract
from django.conf import settings

pytesseract.pytesseract.tesseract_cmd = getattr(settings, "TESSERACT_CMD", "tesseract")


@dataclass
class OcrResult:
    text: str
    avg_confidence: float  # mean Tesseract confidence over real words (0-100)
    word_count: int  # words with >=3 letters; very low count => nothing readable


def preprocess(image_bytes: bytes) -> np.ndarray:
    img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("Unreadable image")
    _, w = img.shape
    if w < 1500:  # upscale small phone/screenshot images
        s = 1500 / w
        img = cv2.resize(img, None, fx=s, fy=s, interpolation=cv2.INTER_CUBIC)
    img = cv2.fastNlMeansDenoising(img, h=12)
    return cv2.adaptiveThreshold(
        img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 15
    )


def run_ocr(image_bytes: bytes) -> OcrResult:
    img = preprocess(image_bytes)
    cfg = "--oem 3 --psm 6"  # psm 6 keeps one medicine per line
    text = pytesseract.image_to_string(img, config=cfg)
    d = pytesseract.image_to_data(img, config=cfg, output_type=pytesseract.Output.DICT)
    confs = [
        float(c)
        for w, c in zip(d["text"], d["conf"])
        if w.strip() and float(c) >= 0 and sum(ch.isalpha() for ch in w) >= 3
    ]
    return OcrResult(text, sum(confs) / len(confs) if confs else 0.0, len(confs))


def image_to_text(image_bytes: bytes) -> str:  # kept for backwards compatibility
    return run_ocr(image_bytes).text
