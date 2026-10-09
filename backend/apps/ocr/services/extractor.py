"""OCR Extraction Service with Multi-pass Deblurring and Enhancement."""

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


def get_ocr_data(image: np.ndarray) -> tuple[str, float]:
    """Run tesseract on an image and calculate average confidence."""
    try:
        raw_text = pytesseract.image_to_string(image)
        data = pytesseract.image_to_data(image, output_type=Output.DICT)
        confidences = [
            int(conf)
            for conf, word in zip(data["conf"], data["text"], strict=True)
            if word.strip() and int(conf) != -1
        ]
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
        return raw_text.strip(), avg_conf
    except Exception:
        return "", 0.0


def enhance_deblur_sharpen(img_bgr: np.ndarray) -> np.ndarray:
    """Deblur and sharpen using CLAHE, unsharp masking, and bicubic upscaling."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr
    
    # 1. Contrast Limited Adaptive Histogram Equalization
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    
    # 2. Unsharp Masking to recover soft/blurry edges
    gaussian = cv2.GaussianBlur(enhanced, (0, 0), 2.0)
    unsharp = cv2.addWeighted(enhanced, 2.0, gaussian, -1.0, 0)
    
    # 3. 2x Bicubic Upsampling for small or low-res text
    h, w = unsharp.shape[:2]
    if max(h, w) < 1800:
        unsharp = cv2.resize(unsharp, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
        
    _, thresh = cv2.threshold(unsharp, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh


def enhance_adaptive_thresh(img_bgr: np.ndarray) -> np.ndarray:
    """Enhance uneven lighting and soft blur with adaptive Gaussian thresholding."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)
    return cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 5
    )


def extract_from_image_bytes(image_bytes: bytes) -> dict[str, Any]:
    """Process raw image bytes and return extracted structured data with highest confidence."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image.")

    candidates: list[tuple[str, float, dict[str, Any]]] = []

    # Pass 1: Raw Original
    raw_text_1, conf_1 = get_ocr_data(img)
    parsed_1 = parse_ocr_text(raw_text_1)
    candidates.append((raw_text_1, conf_1, parsed_1))

    # Pass 2: Grayscale + Otsu
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    raw_text_2, conf_2 = get_ocr_data(otsu)
    parsed_2 = parse_ocr_text(raw_text_2)
    candidates.append((raw_text_2, conf_2, parsed_2))

    # Pass 3: Deblur & Sharpen (Unsharp Mask + CLAHE + 2x Upscale)
    deblurred = enhance_deblur_sharpen(img)
    raw_text_3, conf_3 = get_ocr_data(deblurred)
    parsed_3 = parse_ocr_text(raw_text_3)
    candidates.append((raw_text_3, conf_3, parsed_3))

    # Pass 4: Adaptive Thresholding
    adaptive = enhance_adaptive_thresh(img)
    raw_text_4, conf_4 = get_ocr_data(adaptive)
    parsed_4 = parse_ocr_text(raw_text_4)
    candidates.append((raw_text_4, conf_4, parsed_4))

    # Score candidates: prioritize finding medicine_name, dosage, quantity, and higher confidence
    def score_candidate(cand: tuple[str, float, dict[str, Any]]) -> float:
        text, conf, parsed = cand
        score = conf
        if parsed.get("medicine_name"):
            score += 40
        if parsed.get("dosage"):
            score += 30
        if parsed.get("quantity"):
            score += 15
        if parsed.get("frequency"):
            score += 15
        if len(text) > 20:
            score += 10
        return score

    best_text, best_conf, best_parsed = max(candidates, key=score_candidate)

    return {
        "raw_text": best_text.strip(),
        "confidence": round(best_conf, 2),
        "medicine_name": best_parsed.get("medicine_name"),
        "dosage": best_parsed.get("dosage"),
        "quantity": best_parsed.get("quantity"),
        "frequency": best_parsed.get("frequency"),
        "prescription_details": best_parsed.get("prescription_details"),
    }
