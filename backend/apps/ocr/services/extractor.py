import logging
import shutil
import sys
from pathlib import Path

import pytesseract
from PIL import Image, ImageEnhance, ImageOps

logger = logging.getLogger(__name__)

# Dynamic Tesseract path discovery across Windows, Linux (Render/Docker), and macOS
if sys.platform.startswith("win"):
    if Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe").exists():
        pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    elif shutil.which("tesseract"):
        pytesseract.pytesseract.tesseract_cmd = shutil.which("tesseract")
else:
    # Linux (Render container, Docker, Ubuntu)
    if shutil.which("tesseract"):
        pytesseract.pytesseract.tesseract_cmd = shutil.which("tesseract")
    elif Path("/usr/bin/tesseract").exists():
        pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"
    elif Path("/usr/local/bin/tesseract").exists():
        pytesseract.pytesseract.tesseract_cmd = "/usr/local/bin/tesseract"


def _preprocess_variants(img):
    """
    Generate optimized image variants for challenging pharmaceutical surfaces:
    - Standard enhanced grayscale (autocontrast + sharpness)
    - High-contrast binarized (cuts metallic foil reflections on blister packs)
    - Inverted binarized (reads white/silver text on dark/blue blister foils)
    - High-contrast boosted (for faint doctor handwriting or faded prescription ink)
    """
    # Auto-orient based on camera EXIF data
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # Normalize dimensions for OCR readability
    w, h = img.size
    min_dim = min(w, h)
    max_dim = max(w, h)

    if min_dim < 1000:
        scale = min(1400 / max(min_dim, 1), 3.5)
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    elif max_dim > 2400:
        scale = 2200 / max_dim
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

    # Convert to grayscale
    gray = img.convert("L")

    # Variant 1: Enhanced grayscale (autocontrast + sharpened)
    contrast = ImageOps.autocontrast(gray, cutoff=2)
    enhanced = ImageEnhance.Sharpness(contrast).enhance(2.5)

    # Variant 2: Binarized threshold (135) to segment metallic foil reflections
    binarized = gray.point(lambda p: 255 if p > 135 else 0)

    # Variant 3: Inverted binarized (white/silver text on dark blue/silver foil)
    inverted = ImageOps.invert(binarized)

    # Variant 4: Boosted contrast for doctor handwriting / faint prescription ink
    faint_boost = ImageEnhance.Contrast(ImageOps.autocontrast(gray, cutoff=4)).enhance(2.0)

    return enhanced, binarized, inverted, faint_boost


def extract_text(image_input):
    """
    Robust multi-pass pharmaceutical OCR extractor.
    Combines text extracted across multiple image enhancements, PSM modes,
    and fallback orientations to capture all clinical text from blister packs,
    cartons, bottle labels, and handwritten/printed doctor prescriptions.
    """
    if isinstance(image_input, str | Path):
        image_path = Path(image_input)
        if not image_path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")
        image_obj = Image.open(image_path)
    else:
        try:
            image_input.seek(0)
        except Exception:
            pass
        image_obj = Image.open(image_input)

    try:
        image_obj = ImageOps.exif_transpose(image_obj)
    except Exception:
        pass

    collected_lines = []
    seen_lines_lower = set()

    def add_lines_from_text(raw):
        if not raw:
            return
        for line in raw.splitlines():
            clean = line.strip()
            if len(clean) >= 2 and clean.lower() not in seen_lines_lower:
                seen_lines_lower.add(clean.lower())
                collected_lines.append(clean)

    # Generate variants
    enhanced, binarized, inverted, faint_boost = _preprocess_variants(image_obj)

    # Pass 1: Enhanced grayscale with PSM 6 (Single uniform block of text - best for cartons/boxes)
    try:
        t1 = pytesseract.image_to_string(enhanced, config="--psm 6")
        add_lines_from_text(t1)
    except Exception as e:
        logger.debug(f"Pass 1 failed: {e}")

    # Pass 2: Binarized with PSM 6 (Cuts through blister foil reflections)
    try:
        t2 = pytesseract.image_to_string(binarized, config="--psm 6")
        add_lines_from_text(t2)
    except Exception as e:
        logger.debug(f"Pass 2 failed: {e}")

    # Pass 3: Inverted pass (Reads silver/white text on dark blister foil strips e.g. Dolo/Calpol)
    try:
        t3 = pytesseract.image_to_string(inverted, config="--psm 6")
        add_lines_from_text(t3)
    except Exception as e:
        logger.debug(f"Pass 3 failed: {e}")

    # Pass 4: Faint boost with PSM 3 (Auto page segmentation for doctor prescription slips)
    try:
        t4 = pytesseract.image_to_string(faint_boost, config="--psm 3")
        add_lines_from_text(t4)
    except Exception as e:
        logger.debug(f"Pass 4 failed: {e}")

    # Pass 5: Sparse text PSM 11 (Picks up isolated dosage strength, batch numbers, expiry)
    try:
        t5 = pytesseract.image_to_string(enhanced, config="--psm 11")
        add_lines_from_text(t5)
    except Exception as e:
        logger.debug(f"Pass 5 failed: {e}")

    # Fallback: If very little text was detected, image might be rotated (e.g. blister strip held sideways)
    total_chars = sum(len(line) for line in collected_lines)
    if total_chars < 15:
        for angle in [90, 270]:
            try:
                rotated_enh = enhanced.rotate(angle, expand=True)
                t_rot = pytesseract.image_to_string(rotated_enh, config="--psm 6")
                add_lines_from_text(t_rot)
                if sum(len(line) for line in collected_lines) >= 20:
                    break
            except Exception:
                pass

    return "\n".join(collected_lines)
