import io
import os
import shutil

import pytesseract
from PIL import Image


DEFAULT_TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def configure_tesseract() -> None:
    """
    Configure the Tesseract executable used by pytesseract.

    The TESSERACT_CMD environment variable can be used to provide
    a custom Tesseract installation path. Otherwise, this function
    checks the system PATH and the standard Windows installation path.
    """
    configured_path = os.getenv("TESSERACT_CMD")

    if configured_path:
        pytesseract.pytesseract.tesseract_cmd = configured_path
        return

    tesseract_from_path = shutil.which("tesseract")

    if tesseract_from_path:
        pytesseract.pytesseract.tesseract_cmd = tesseract_from_path
        return

    if os.path.exists(DEFAULT_TESSERACT_PATH):
        pytesseract.pytesseract.tesseract_cmd = DEFAULT_TESSERACT_PATH
        return

    raise RuntimeError(
        "Tesseract OCR was not found. Install Tesseract or set "
        "the TESSERACT_CMD environment variable."
    )


def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extract raw text from an image using Tesseract OCR.
    """
    configure_tesseract()

    try:
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:
        raise ValueError("The uploaded file is not a valid image.") from exc

    try:
        text = pytesseract.image_to_string(
            image,
            lang="eng",
        )
    except pytesseract.TesseractError as exc:
        raise RuntimeError(
            f"Tesseract OCR failed: {exc}"
        ) from exc

    return text.strip()