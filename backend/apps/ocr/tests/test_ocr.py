import pytest
from ml.src.ocr.extractor import PrescriptionOcrExtractor
from rest_framework import status
from rest_framework.test import APIClient

from apps.medications.models import Medication


@pytest.mark.django_db
class TestOcrPipeline:
    def setup_method(self):
        self.client = APIClient()
        self.extractor = PrescriptionOcrExtractor()

    def test_parse_prescription_text(self):
        sample_text = (
            "Rx: Metformin 500 mg. Take 1 tablet twice daily. Total 60 tablets. Dr. Robert Vance"
        )
        result = self.extractor.parse_prescription_text(sample_text)

        assert result["medicineName"] == "Metformin"
        assert result["dosage"] == "500 mg"
        assert result["quantity"] == 60
        assert result["frequency"] == "2 times daily"
        assert "Dr. Robert Vance" in result["doctorName"]
        assert float(result["confidenceScore"].replace("%", "")) >= 80.0

    def test_ocr_scan_endpoint(self):
        response = self.client.post(
            "/api/ocr/scan/",
            {"raw_text": "Amoxicillin 250 mg 3 times daily Qty 30"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["medicineName"] == "Amoxicillin"
        assert data["dosage"] == "250 mg"
        assert data["quantity"] == 30

    def test_ocr_confirm_endpoint(self):
        payload = {
            "medicineName": "Atorvastatin",
            "dosage": "20 mg",
            "quantity": 30,
            "frequency": "1 time daily",
            "timesOfDay": ["Night"],
            "diseaseCategory": "Heart",
            "doctorName": "Dr. Michael Chen",
        }
        response = self.client.post("/api/ocr/confirm/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

        med = Medication.objects.get(name="Atorvastatin")
        assert med.dosage == "20 mg"
        assert med.stock == 30
        assert med.stock_days == 30
