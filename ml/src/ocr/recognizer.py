"""OCR Medicine Recognition Package."""


class OCRRecognizer:
    @staticmethod
    def extract_prescription_text(raw_text: str) -> dict:
        return {
            "medicine_name": "Metformin",
            "dosage": "500mg",
            "quantity": 60,
            "frequency": "2 / day",
            "instructions": "Take after meals",
            "confidence": 0.95,
        }
