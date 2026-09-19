from pathlib import Path

import pytesseract
from PIL import Image


def extract_text(file_path):
    """
    Extract text from an image using Tesseract OCR.
    """
    image = Image.open(Path(file_path))
    return pytesseract.image_to_string(image).strip()
