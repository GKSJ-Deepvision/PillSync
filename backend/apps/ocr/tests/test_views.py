import io
import pathlib
import tempfile
from unittest.mock import patch

import pytesseract
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from apps.common.testing import SupabaseAuthTestMixin
from apps.ocr.models import PrescriptionScan

FIXTURES = pathlib.Path(__file__).parent / "fixtures"
FAKE_RESULT = {
    "source": "tesseract",
    "handwriting_suspected": False,
    "warnings": [],
    "ocr": {"avg_confidence": 80, "word_count": 40},
    "doctor": "",
    "prescription_date": "",
    "expires_on": "",
    "refills_remaining": None,
    "needs_review": False,
    "medicine_count": 2,
    "medicines": [
        {"name": "Metformin", "strength": "500mg", "doses_per_day": 2, "quantity": 60},
        {"name": "Amlodipine", "strength": "5mg", "doses_per_day": 1, "quantity": 30},
    ],
}


def png_upload():
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), color="white").save(buf, format="PNG")
    return SimpleUploadedFile("scan.png", buf.getvalue(), content_type="image/png")


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class PrescriptionScanUploadViewTests(SupabaseAuthTestMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.url = "/api/ocr/scan/"

    def test_requires_login(self):
        self.assertEqual(
            self.client.post(self.url, {"image": png_upload()}, format="multipart").status_code, 401
        )

    def test_missing_image_returns_400(self):
        r = self.client.post(self.url, {}, format="multipart", **self.auth_header)
        self.assertEqual(r.status_code, 400)

    @patch("apps.ocr.views.scan_image", return_value=FAKE_RESULT)
    def test_returns_all_medicines_and_saves_them(self, mock_scan):
        r = self.client.post(
            self.url, {"image": png_upload()}, format="multipart", **self.auth_header
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual([m["name"] for m in r.data["medicines"]], ["Metformin", "Amlodipine"])
        scan = PrescriptionScan.objects.get()
        self.assertEqual(scan.result["medicine_count"], 2)
        self.assertEqual((scan.medicine_name, scan.dosage), ("Metformin", "500mg"))

    @patch("apps.ocr.views.scan_image", return_value=FAKE_RESULT)
    def test_patient_is_the_signed_in_user_not_a_body_field(self, mock_scan):
        self.client.post(
            self.url,
            {"image": png_upload(), "patient_id": "11111111-1111-1111-1111-111111111111"},
            format="multipart",
            **self.auth_header,
        )
        self.assertEqual(str(PrescriptionScan.objects.get().patient_id), self.user_id)

    @patch(
        "apps.ocr.views.scan_image",
        side_effect=ValueError("Unsupported image type. Use JPG, PNG or WebP."),
    )
    def test_bad_upload_returns_400_with_reason(self, mock_scan):
        r = self.client.post(
            self.url, {"image": png_upload()}, format="multipart", **self.auth_header
        )
        self.assertEqual(r.status_code, 400)
        self.assertIn("Unsupported", r.data["detail"])

    @patch("apps.ocr.views.scan_image", side_effect=pytesseract.TesseractNotFoundError())
    def test_missing_tesseract_returns_503_not_500(self, mock_scan):
        r = self.client.post(
            self.url, {"image": png_upload()}, format="multipart", **self.auth_header
        )
        self.assertEqual(r.status_code, 503)

    def test_end_to_end_printed_prescription_through_the_api(self):
        upload = SimpleUploadedFile(
            "rx.jpg", (FIXTURES / "printed_table.jpg").read_bytes(), content_type="image/jpeg"
        )
        r = self.client.post(self.url, {"image": upload}, format="multipart", **self.auth_header)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["medicine_count"], 4)
        self.assertEqual([m["quantity"] for m in r.data["medicines"]], [20, 20, 40, 10])
        self.assertEqual(r.data["source"], "tesseract")

    def test_non_image_upload_rejected(self):
        upload = SimpleUploadedFile("x.png", b"not really an image", content_type="image/png")
        r = self.client.post(self.url, {"image": upload}, format="multipart", **self.auth_header)
        self.assertEqual(r.status_code, 400)
