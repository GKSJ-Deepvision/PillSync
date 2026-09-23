"""
Hybrid scan pipeline: Tesseract for clean print, vision model for handwriting / low quality.
Drop into: backend/apps/ocr/services/pipeline.py
"""

from __future__ import annotations

import io
from collections.abc import Callable

from PIL import Image, UnidentifiedImageError

from .extractor import run_ocr
from .parser import parse_prescription
from .vision import VisionError, call_vision_model, extract_with_vision, vision_enabled

MAX_BYTES = 10 * 1024 * 1024
ALLOWED = {"jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
MIN_CONF, MIN_WORDS = 65.0, 25


def validate_upload(image_bytes: bytes) -> str:
    if len(image_bytes) > MAX_BYTES:
        raise ValueError("Image too large (max 10 MB).")
    try:
        kind = (Image.open(io.BytesIO(image_bytes)).format or "").lower()
    except (UnidentifiedImageError, OSError):
        kind = ""
    if kind not in ALLOWED:
        raise ValueError("Unsupported image type. Use JPG, PNG or WebP.")
    return ALLOWED[kind]


def scan_image(
    image_bytes: bytes,
    known_medicines: list[str] | None = None,
    vision_call: Callable[[bytes, str], str] | None = None,
    use_vision: bool | None = None,
) -> dict:
    """
    Returns the parsed prescription plus:
      source: "tesseract" | "vision"
      handwriting_suspected, ocr: {avg_confidence, word_count}, warnings
    Nothing here is authoritative: every result must go through the user-review screen.
    """
    media_type = validate_upload(image_bytes)
    ocr = run_ocr(image_bytes)
    result = parse_prescription(ocr.text, known_medicines)
    result.update(
        source="tesseract",
        handwriting_suspected=False,
        warnings=[],
        ocr={"avg_confidence": round(ocr.avg_confidence, 1), "word_count": ocr.word_count},
    )

    poor = (
        ocr.avg_confidence < MIN_CONF or ocr.word_count < MIN_WORDS or result["medicine_count"] == 0
    )
    result["handwriting_suspected"] = poor
    if not (poor or result["needs_review"]):
        return result

    enabled = vision_enabled() if use_vision is None else use_vision
    if not enabled:
        if poor:
            result["warnings"].append(
                "This image looks handwritten or low quality; Tesseract cannot read it reliably. "
                "Enable the vision reader (PILLSYNC_VISION_PROVIDER) or enter the medicines manually."
            )
        return result

    try:
        vis = extract_with_vision(image_bytes, media_type, vision_call or call_vision_model)
    except VisionError as e:
        result["warnings"].append(f"Vision reader failed ({e}); showing Tesseract result.")
        return result
    if vis["medicine_count"] == 0 and result["medicine_count"] > 0:
        result["warnings"].append("Vision reader found no medicines; showing Tesseract result.")
        return result
    vis.update(
        source="vision",
        handwriting_suspected=poor or vis.get("handwritten", False),
        warnings=[],
        ocr=result["ocr"],
    )
    return vis
