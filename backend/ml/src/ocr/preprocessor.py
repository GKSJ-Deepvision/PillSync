import io
from typing import Any

try:
    from PIL import Image, ImageEnhance, ImageFilter

    HAS_PIL = True
except ImportError:
    HAS_PIL = False


def preprocess_image(image_bytes: bytes) -> Any:
    """Preprocess image bytes for OCR processing.

    Performs grayscale conversion, contrast enhancement, sharpening, and resizing.
    """
    if not HAS_PIL:
        return image_bytes

    image = Image.open(io.BytesIO(image_bytes))

    # Convert to RGB if needed
    if image.mode not in ("L", "RGB"):
        image = image.convert("RGB")

    # Grayscale
    gray_img = image.convert("L")

    # Enhance contrast
    enhancer = ImageEnhance.Contrast(gray_img)
    contrast_img = enhancer.enhance(1.8)

    # Sharpen image details
    sharpened_img = contrast_img.filter(ImageFilter.SHARPEN)

    # Resize if too small
    w, h = sharpened_img.size
    if w < 1000:
        scale = 1000 / float(w)
        sharpened_img = sharpened_img.resize((1000, int(h * scale)), Image.Resampling.LANCZOS)

    return sharpened_img
