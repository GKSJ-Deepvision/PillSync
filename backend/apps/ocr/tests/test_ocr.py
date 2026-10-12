from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APIClient

from apps.ocr.services.parser import parse_ocr_text


def test_parse_ocr_text_empty():
    result = parse_ocr_text("")
    assert result["medicine_name"] is None
    assert result["confidence"] == 0.0


def test_parse_ocr_text_paracetamol():
    raw_text = "Paracetamol 500 mg\nTake 1 tablet twice daily\nQuantity: 30 tablets"
    result = parse_ocr_text(raw_text)
    assert result["medicine_name"] == "Paracetamol"
    assert "500" in result["strength"]
    assert result["quantity"] == 30


def test_ocr_endpoint_success():
    client = APIClient()
    # Mock extract_text so Tesseract binary is not required during test execution
    with patch("apps.ocr.views.extract_text") as mock_extract:
        mock_extract.return_value = "Paracetamol 500 mg\nTake 1 tablet daily"
        # Provide a dummy image in multipart
        from io import BytesIO

        from PIL import Image

        image_io = BytesIO()
        image = Image.new("RGB", (100, 100), color="white")
        image.save(image_io, format="JPEG")
        image_io.seek(0)
        image_io.name = "prescription.jpg"

        response = client.post(
            "/api/ocr/",
            {"image": image_io},
            format="multipart",
        )

        assert response.status_code == status.HTTP_200_OK
        assert "raw_text" in response.data
        assert response.data["data"]["medicine_name"] == "Paracetamol"
