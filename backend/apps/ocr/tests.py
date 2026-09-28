from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory, APITestCase, force_authenticate

from apps.api.serializers import OCRRecordSerializer
from apps.api.views import OCRCorrectionView, OCRUploadView
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
        self.assertIsNotNone(record.confidence)
        self.assertGreaterEqual(record.confidence, 0.0)
        self.assertLessEqual(record.confidence, 1.0)
        self.assertFalse(record.is_uncertain)


class OCRCorrectionViewTests(APITestCase):
    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="ocr_correction_user",
            email="ocr_correction_user@example.com",
        )

        self.other_user = User.objects.create_user(
            username="other_ocr_user",
            email="other_ocr_user@example.com",
        )

        self.record = OCRRecord.objects.create(
            user=self.user,
            file=SimpleUploadedFile(
                "medicine.jpg",
                b"fake image content",
                content_type="image/jpeg",
            ),
            upload_type=OCRRecord.UploadType.MEDICINE_IMAGE,
            status=OCRRecord.Status.COMPLETED,
            extracted_text="Paracetamol Tablets IP 500 mg",
            confidence=0.4,
            is_uncertain=True,
        )

    def test_owner_can_correct_ocr_fields(self):
        request = APIRequestFactory().patch(
            f"/api/ocr/{self.record.id}/",
            {
                "medicine_name": "Paracetamol Tablets IP",
                "dosage": "500 mg",
                "quantity": "40 x 10 Tablets",
                "frequency": "Twice daily",
                "prescription_details": "Take after food",
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        response = OCRCorrectionView.as_view()(
            request,
            pk=self.record.id,
        )

        self.assertEqual(response.status_code, 200)

        self.record.refresh_from_db()

        self.assertEqual(
            self.record.medicine_name,
            "Paracetamol Tablets IP",
        )
        self.assertEqual(self.record.dosage, "500 mg")
        self.assertEqual(self.record.quantity, "40 x 10 Tablets")
        self.assertEqual(self.record.frequency, "Twice daily")
        self.assertEqual(
            self.record.prescription_details,
            "Take after food",
        )

    def test_unauthenticated_user_cannot_correct_ocr(self):
        request = APIRequestFactory().patch(
            f"/api/ocr/{self.record.id}/",
            {
                "medicine_name": "Corrected Medicine",
            },
            format="json",
        )

        response = OCRCorrectionView.as_view()(
            request,
            pk=self.record.id,
        )

        self.assertEqual(response.status_code, 401)

    def test_user_cannot_correct_another_users_ocr(self):
        request = APIRequestFactory().patch(
            f"/api/ocr/{self.record.id}/",
            {
                "medicine_name": "Unauthorized Correction",
            },
            format="json",
        )
        force_authenticate(request, user=self.other_user)

        response = OCRCorrectionView.as_view()(
            request,
            pk=self.record.id,
        )

        self.assertEqual(response.status_code, 404)

        self.record.refresh_from_db()

        self.assertEqual(self.record.medicine_name, "")
