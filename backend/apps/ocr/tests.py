from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory, APITestCase, force_authenticate

from apps.api.serializers import OCRRecordSerializer
from apps.api.views import OCRUploadView
from apps.ocr.models import OCRRecord


class OCRRecordSerializerTests(APITestCase):
    def test_valid_image_file(self):
        file = SimpleUploadedFile(
            "medicine.jpg",
            b"fake image content",
            content_type="image/jpeg",
        )

        serializer = OCRRecordSerializer(
            data={
                "file": file,
                "upload_type": "medicine_image",
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_rejects_unsupported_file_type(self):
        file = SimpleUploadedFile(
            "medicine.txt",
            b"fake text content",
            content_type="text/plain",
        )

        serializer = OCRRecordSerializer(
            data={
                "file": file,
                "upload_type": "medicine_image",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("file", serializer.errors)

    def test_rejects_file_larger_than_5_mb(self):
        file = SimpleUploadedFile(
            "large.jpg",
            b"x" * (5 * 1024 * 1024 + 1),
            content_type="image/jpeg",
        )

        serializer = OCRRecordSerializer(
            data={
                "file": file,
                "upload_type": "medicine_image",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("file", serializer.errors)


class OCRUploadViewTests(APITestCase):
    def test_medicine_image_runs_ocr(self):
        image_path = Path(settings.BASE_DIR) / "apps" / "ocr" / "sample_medicine.png"

        with image_path.open("rb") as image_file:
            uploaded_file = SimpleUploadedFile(
                "sample_medicine.png",
                image_file.read(),
                content_type="image/png",
            )

        User = get_user_model()
        user = User.objects.create_user(
            username="ocr_test_user",
            password="testpass123",
        )

        request = APIRequestFactory().post(
            "/api/ocr/upload/",
            {
                "file": uploaded_file,
                "upload_type": "medicine_image",
            },
            format="multipart",
        )
        force_authenticate(request, user=user)

        response = OCRUploadView.as_view()(request)

        self.assertEqual(response.status_code, 201)

        record = OCRRecord.objects.get(id=response.data["id"])

        self.assertEqual(record.status, OCRRecord.Status.COMPLETED)
        self.assertTrue(record.extracted_text)
