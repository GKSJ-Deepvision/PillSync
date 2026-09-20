import os
import cv2
import pytesseract
from pytesseract import Output
import sys

# Add backend directory to sys.path so we can import from apps
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Now we can import the parser inside the function to avoid circular/sys.path issues

# Configure Tesseract path
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def run_integration_experiment():
    print("=== OCR + Parser Integration Experiment ===\n")

    # 1. Load the prescription image
    image_path = os.path.join(os.path.dirname(__file__), "sample_prescription.png")
    if not os.path.exists(image_path):
        print(f"Error: Could not find image at {image_path}")
        return

    # Use original image for this baseline since we found it worked best for synthetic
    image = cv2.imread(image_path)

    # 2 & 3. Run Tesseract to get raw text and confidence
    text = pytesseract.image_to_string(image)
    
    data = pytesseract.image_to_data(image, output_type=Output.DICT)
    confidences = [int(conf) for conf, word in zip(data['conf'], data['text'], strict=True) 
                   if word.strip() and int(conf) != -1]

    avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

    print("RAW OCR TEXT:")
    print("-" * 30)
    print(text.strip())
    print("-" * 30)
    print(f"OCR Confidence: {avg_conf:.2f}%\n")

    # 4. Pass raw text into parser
    from apps.ocr.services.parser import parse_ocr_text
    parsed_result = parse_ocr_text(text)

    # 5. Print the structured result
    print("PARSED RESULT:")
    print("-" * 30)
    for key, value in parsed_result.items():
        if key == "prescription_details":
            continue
        print(f"{key}: {value if value is not None else 'None (Failed to extract)'}")

    print(f"prescription_details: [Omitted for brevity, length={len(parsed_result['prescription_details'])}]")

if __name__ == "__main__":
    run_integration_experiment()
