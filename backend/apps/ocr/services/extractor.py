import base64
from typing import Any

from ml.src.ocr.extractor import PrescriptionOcrExtractor
from ml.src.ocr.preprocessor import preprocess_image


class OcrService:
    def __init__(self):
        self.extractor = PrescriptionOcrExtractor()

    def process_image_file(self, image_file) -> dict[str, Any]:
        image_bytes = image_file.read()
        processed_img = preprocess_image(image_bytes)
        return self.extractor.extract_from_image(processed_img)

    def process_base64_image(self, base64_str: str) -> dict[str, Any]:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        image_bytes = base64.b64decode(base64_str)
        processed_img = preprocess_image(image_bytes)
        return self.extractor.extract_from_image(processed_img)

    def process_raw_text(self, text: str) -> dict[str, Any]:
        return self.extractor.parse_prescription_text(text)
