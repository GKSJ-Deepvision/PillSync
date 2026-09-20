import os
import cv2
import pytesseract
from apps.ocr.services.parser import parse_ocr_text

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def test_tesseract_to_parser_integration():
    """
    End-to-end integration test reading the actual synthetic image,
    passing it to Tesseract, and running the parser on the result.
    """
    # Locate the image in ml/src/ocr
    image_path = os.path.abspath(os.path.join(
        os.path.dirname(__file__), 
        "..", "..", "..", "..", "ml", "src", "ocr", "sample_prescription.png"
    ))
    
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
