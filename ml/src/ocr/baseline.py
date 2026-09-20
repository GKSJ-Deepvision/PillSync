import os
import cv2
import pytesseract
from pytesseract import Output

# NOTE: Configure Tesseract executable path for Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def run_ocr_and_get_confidence(image, desc):
    """
    Runs Tesseract on the given image array and prints out the raw text,
    along with average confidence for detected words.
    
    WHY: We need to see if preprocessing actually improves the OCR engine's
    confidence and accuracy.
    """
    print(f"\n{'='*50}")
    print(f"--- OCR Output: {desc} ---")
    print(f"{'='*50}")
    
    # Run standard image_to_string for raw text
    text = pytesseract.image_to_string(image)
    print("RAW TEXT:\n")
    print(text.strip())
    print("-" * 50)
    
    # Run image_to_data to get word-level bounding boxes and confidences
    # Output.DICT returns a dictionary containing arrays for words, confidences, etc.
    data = pytesseract.image_to_data(image, output_type=Output.DICT)
    
    # Filter out empty words/spaces which typically have -1 confidence
    confidences = [int(conf) for conf, text in zip(data['conf'], data['text']) 
                   if text.strip() and int(conf) != -1]
                   
    if confidences:
        avg_conf = sum(confidences) / len(confidences)
        print(f"Average Confidence: {avg_conf:.2f}%")
        print(f"Total Words Detected: {len(confidences)}")
    else:
        print("No text detected with confidence.")

def main():
    # 1. Load the prescription image
    # WHY: OpenCV loads images as numpy arrays, which we need for matrix operations
    # like thresholding.
    image_path = os.path.join(os.path.dirname(__file__), "sample_prescription.png")
    if not os.path.exists(image_path):
        print(f"Error: Could not find image at {image_path}")
        return

    # Load original image (BGR format by default in cv2)
    original_img = cv2.imread(image_path)
    
    # Experiment A: Original Image
    # WHY: We establish a baseline to see if preprocessing is even necessary.
    # Often, modern Tesseract handles clean images fine without help.
    run_ocr_and_get_confidence(original_img, "Original BGR Image")
    
    # Experiment B: Grayscale Image
    # WHY: Color information usually confuses OCR engines. Converting to grayscale
    # simplifies the image to single-channel intensity, removing noise from colored backgrounds.
    gray_img = cv2.cvtColor(original_img, cv2.COLOR_BGR2GRAY)
    run_ocr_and_get_confidence(gray_img, "Grayscale Image")
    
    # Experiment C: Thresholded Image (Binarization)
    # WHY: OCR engines work best with stark black-and-white contrast. 
    # OTSU thresholding automatically finds the optimal threshold value to separate
    # dark text (foreground) from light paper (background).
    # We apply THRESH_BINARY to make text purely black and background purely white.
    _, thresh_img = cv2.threshold(gray_img, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    run_ocr_and_get_confidence(thresh_img, "OTSU Thresholded Image")

if __name__ == "__main__":
    main()
