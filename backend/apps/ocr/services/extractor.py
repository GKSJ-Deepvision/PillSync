from pathlib import Path

import pytesseract
from PIL import Image

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def extract_text(image_path):
    """
    Extract raw text from a medicine/prescription image.

    Supports:
    - Local file paths
    - Django uploaded files
    """

    if isinstance(image_path, str | Path):
        image_path = Path(image_path)

        if not image_path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        with Image.open(image_path) as image:
            image = image.convert("RGB")
            text = pytesseract.image_to_string(image)

    else:
        image_path.seek(0)

        with Image.open(image_path) as image:
            image = image.convert("RGB")
            text = pytesseract.image_to_string(image)

    return text.strip()
