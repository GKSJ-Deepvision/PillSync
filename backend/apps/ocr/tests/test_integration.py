import os
import cv2
import pytesseract
from apps.ocr.services.parser import parse_ocr_text
import shutil
if not shutil.which("tesseract"):
    for cand in [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Users\Aryanarit\anaconda3\Library\bin\tesseract.exe",
        os.path.expanduser(r"~\anaconda3\Library\bin\tesseract.exe"),
    ]:
        if os.path.exists(cand):
            pytesseract.pytesseract.tesseract_cmd = cand
            break


def test_tesseract_to_parser_integration():
    """
    End-to-end integration test reading the actual synthetic image,
    passing it to Tesseract, and running the parser on the result.
    """
    import pytest
    if not shutil.which("tesseract") and not any(
        os.path.exists(p) for p in [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Users\Aryanarit\anaconda3\Library\bin\tesseract.exe",
        ]
    ):
        pytest.skip("Tesseract OCR binary not installed on system")
    # Locate the image in ml/src/ocr
    image_path = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "..",
            "..",
            "ml",
            "src",
            "ocr",
            "sample_prescription.png",
        )
    )

    assert os.path.exists(image_path), f"Synthetic image missing at {image_path}"
    # Run Tesseract
    image = cv2.imread(image_path)
    text = pytesseract.image_to_string(image)

    # Parse text
    result = parse_ocr_text(text)

    # Assert expected structured data from the image
    assert result["medicine_name"] == "Lisinopril"
    assert result["dosage"] == "10mg"
    assert result["quantity"] == 30
    assert result["frequency"] == "DAILY"
    assert "Lisinopril 10mg" in result["prescription_details"]
