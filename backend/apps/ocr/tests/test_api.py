"""Tests for OCR API endpoints."""

import io
import os
from PIL import Image
from django.urls import reverse
import pytest
from rest_framework import status


@pytest.fixture
def sample_image_file():
    """Generates a small test image in-memory."""
    file = io.BytesIO()
    image = Image.new("RGB", (200, 100), color=(255, 255, 255))
    image.save(file, "PNG")
    file.name = "test.png"
    file.seek(0)
    return file


@pytest.fixture
def prescription_image_file():
    """Loads the real sample prescription from ml/src/ocr/sample_prescription.png if available."""
    path = os.path.abspath(
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
    if os.path.exists(path):
        with open(path, "rb") as f:
            file = io.BytesIO(f.read())
            file.name = "sample_prescription.png"
            file.seek(0)
            return file
    return None


@pytest.mark.django_db
class TestOCRScanAPI:
    def test_unauthenticated_cannot_scan(self, api_client, sample_image_file):
        url = reverse("v1:ocr:ocr-scan")
        response = api_client.post(url, {"image": sample_image_file}, format="multipart")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_scan_valid_image(self, patient_client, sample_image_file):
        url = reverse("v1:ocr:ocr-scan")
        response = patient_client.post(url, {"image": sample_image_file}, format="multipart")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "confidence" in data
        assert "raw_text" in data
        assert "medicine_name" in data
        assert "dosage" in data

    def test_scan_real_sample_prescription(self, patient_client, prescription_image_file):
        if not prescription_image_file:
            pytest.skip("sample_prescription.png not found")
        import shutil
        if not shutil.which("tesseract") and not any(
            os.path.exists(p) for p in [
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Users\Aryanarit\anaconda3\Library\bin\tesseract.exe",
            ]
        ):
            pytest.skip("Tesseract OCR binary not installed on system")
        url = reverse("v1:ocr:ocr-scan")
        response = patient_client.post(url, {"image": prescription_image_file}, format="multipart")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["confidence"] > 0
        assert data["medicine_name"] == "Lisinopril"
        assert data["dosage"] == "10mg"
        assert data["quantity"] == 30
        assert data["frequency"] == "DAILY"

    def test_invalid_file_rejected(self, patient_client):
        url = reverse("v1:ocr:ocr-scan")
        text_file = io.BytesIO(b"Not an image")
        text_file.name = "document.txt"
        response = patient_client.post(url, {"image": text_file}, format="multipart")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_sample_image_endpoint(self, patient_client):
        url = reverse("v1:ocr:ocr-sample-image")
        response = patient_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "image/png"
