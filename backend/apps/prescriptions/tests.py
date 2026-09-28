from datetime import date

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APITestCase

from apps.prescriptions.models import Prescription
from apps.prescriptions.services.parser import parse_ocr_text


class PrescriptionModelTests(TestCase):
    def test_create_prescription(self):
        User = get_user_model()
        user = User.objects.create_user(username="prescription_test_user")

        file = SimpleUploadedFile(
            "prescription.pdf",
            b"fake prescription content",
            content_type="application/pdf",
        )

        prescription = Prescription.objects.create(
            user=user,
            file=file,
            doctor_name="Dr. Test",
            issue_date=date(2026, 9, 27),
            expiry_date=date(2027, 9, 27),
        )

        self.assertEqual(prescription.user, user)
        self.assertEqual(prescription.doctor_name, "Dr. Test")
        self.assertEqual(prescription.issue_date, date(2026, 9, 27))
        self.assertEqual(prescription.expiry_date, date(2027, 9, 27))
        self.assertTrue(prescription.file.name.startswith("prescriptions/"))


class PrescriptionAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="api_prescription_user",
            email="api_prescription_user@example.com",
        )

        self.other_user = User.objects.create_user(
            username="other_prescription_user",
            email="other_prescription_user@example.com",
        )

        self.url = "/api/prescriptions/"

    def test_unauthenticated_user_cannot_access_prescriptions(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_can_create_prescription(self):
        self.client.force_authenticate(user=self.user)

        file = SimpleUploadedFile(
            "prescription.pdf",
            b"fake prescription content",
            content_type="application/pdf",
        )

        response = self.client.post(
            self.url,
            {
                "file": file,
                "doctor_name": "Dr. Test",
                "issue_date": "2026-09-27",
                "expiry_date": "2027-09-27",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            Prescription.objects.get(id=response.data["id"]).user,
            self.user,
        )

    def test_user_only_sees_own_prescriptions(self):
        self.client.force_authenticate(user=self.user)

        file = SimpleUploadedFile(
            "prescription.pdf",
            b"fake prescription content",
            content_type="application/pdf",
        )

        Prescription.objects.create(
            user=self.user,
            file=file,
            doctor_name="My Doctor",
            issue_date="2026-09-27",
            expiry_date="2027-09-27",
        )

        other_file = SimpleUploadedFile(
            "other-prescription.pdf",
            b"other prescription content",
            content_type="application/pdf",
        )

        Prescription.objects.create(
            user=self.other_user,
            file=other_file,
            doctor_name="Other Doctor",
            issue_date="2026-09-27",
            expiry_date="2027-09-27",
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["doctor_name"], "My Doctor")


class PrescriptionParserTests(TestCase):
    def test_parse_ocr_text_extracts_medicine_details(self):
        text = """
        Paracetamol Tablets IP
        500 mg
        10 x 10 Tablets
        For Fever and Mild to Moderate Pain
        """

        result = parse_ocr_text(text)

        self.assertEqual(result["medicine_name"], "Paracetamol Tablets IP")
        self.assertEqual(result["dosage"], "500 mg")
        self.assertEqual(result["quantity"], "10 x 10 Tablets")
        self.assertIsNone(result["frequency"])
        self.assertEqual(
            result["prescription_details"],
            "For Fever and Mild to Moderate Pain",
        )

    def test_parse_ocr_text_handles_empty_text(self):
        result = parse_ocr_text("")

        self.assertEqual(
            result,
            {
                "medicine_name": None,
                "dosage": None,
                "quantity": None,
                "frequency": None,
                "prescription_details": None,
            },
        )
