from typing import Any


class PrescriptionParser:
    @staticmethod
    def validate_and_normalize(ocr_data: dict[str, Any]) -> dict[str, Any]:
        """Normalize extracted OCR dictionary fields for medication database insertion."""
        name = ocr_data.get("medicineName", "Unknown Medicine").strip()
        dosage = ocr_data.get("dosage", "500 mg").strip()
        quantity = int(ocr_data.get("quantity", 30))
        frequency = ocr_data.get("frequency", "1 time daily").strip()
        times_of_day = ocr_data.get("timesOfDay", ["Morning"])
        doctor_name = ocr_data.get("doctorName", "Unspecified Doctor").strip()

        return {
            "name": name,
            "dosage": dosage,
            "stock": quantity,
            "total_stock": max(60, quantity),
            "frequency": frequency,
            "times_of_day": times_of_day,
            "disease_category": "General",
            "doctor_name": doctor_name,
            "confidence_score": ocr_data.get("confidenceScore", "90.0%"),
            "requires_manual_review": ocr_data.get("requiresManualReview", False),
        }
