from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from apps.ocr.serializers import OCRRecordSerializer


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
