"""OCR Extraction Service."""

from __future__ import annotations

import os
import shutil
from typing import Any

import cv2
import numpy as np
import pytesseract
from pytesseract import Output

from apps.ocr.services.parser import parse_ocr_text

# Set Tesseract executable if not in system PATH
if not shutil.which("tesseract"):
    windows_default = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(windows_default):
        pytesseract.pytesseract.tesseract_cmd = windows_default


def preprocess_image(img_bgr: np.ndarray) -> np.ndarray:
    """Apply basic preprocessing (grayscale + OTSU thresholding) to improve OCR clarity."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    return thresh


def extract_from_image_bytes(image_bytes: bytes) -> dict[str, Any]:
    """Process raw image bytes and return extracted structured data with confidence."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image.")

    # 1. OCR on original
    raw_text = pytesseract.image_to_string(img)
    data = pytesseract.image_to_data(img, output_type=Output.DICT)
    confidences = [
        int(conf)
        for conf, word in zip(data["conf"], data["text"], strict=True)
        if word.strip() and int(conf) != -1
    ]

    # If low text or low confidence, try OTSU preprocessed
    avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
    if len(raw_text.strip()) < 5 or avg_conf < 40:
        preprocessed = preprocess_image(img)
        p_text = pytesseract.image_to_string(preprocessed)
        p_data = pytesseract.image_to_data(preprocessed, output_type=Output.DICT)
        p_confidences = [
            int(conf)
            for conf, word in zip(p_data["conf"], p_data["text"], strict=True)
            if word.strip() and int(conf) != -1
        ]
        p_avg_conf = sum(p_confidences) / len(p_confidences) if p_confidences else 0.0
        if len(p_text.strip()) > len(raw_text.strip()) or p_avg_conf > avg_conf:
            raw_text = p_text
            avg_conf = p_avg_conf

    # 2. Parse text with structured parser
    parsed = parse_ocr_text(raw_text)

    return {
        "raw_text": raw_text.strip(),
        "confidence": round(avg_conf, 2),
        "medicine_name": parsed.get("medicine_name"),
        "dosage": parsed.get("dosage"),
        "quantity": parsed.get("quantity"),
        "frequency": parsed.get("frequency"),
        "prescription_details": parsed.get("prescription_details"),
    }
