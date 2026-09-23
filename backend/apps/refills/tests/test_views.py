import uuid

from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.testing import SupabaseAuthTestMixin
from apps.refills.models import RefillCheck


class RefillCheckViewTests(SupabaseAuthTestMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.url = "/api/refills/check/"

    def test_requires_login(self):
        response = self.client.post(self.url, {"medication_id": str(uuid.uuid4())}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_valid_check_returns_prediction(self):
        response = self.client.post(
            self.url,
            {
                "medication_id": str(uuid.uuid4()),
                "medicine_name": "Amlodipine",
                "quantity_on_hand": 60,
                "daily_consumption": 2,
            },
            format="json",
            **self.auth_header,
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["days_remaining"], 30)
        self.assertIsNotNone(response.data["depletion_date"])
        self.assertFalse(response.data["is_low_stock"])

    def test_patient_comes_from_token_not_from_request_body(self):
        someone_else = str(uuid.uuid4())
        self.client.post(
            self.url,
            {
                "medication_id": str(uuid.uuid4()),
                "patient_id": someone_else,
                "quantity_on_hand": 60,
                "daily_consumption": 2,
            },
            format="json",
            **self.auth_header,
        )
        check = RefillCheck.objects.get()
        self.assertEqual(str(check.patient_id), self.user_id)
        self.assertNotEqual(str(check.patient_id), someone_else)

    def test_low_stock_check_includes_message(self):
        response = self.client.post(
            self.url,
            {
                "medication_id": str(uuid.uuid4()),
                "medicine_name": "Metformin",
                "quantity_on_hand": 8,
                "daily_consumption": 2,
                "low_stock_threshold_days": 5,
            },
            format="json",
            **self.auth_header,
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["is_low_stock"])
        self.assertIn("Metformin", response.data["message"])

    def test_missing_required_field_returns_400(self):
        response = self.client.post(
            self.url, {"medication_id": str(uuid.uuid4())}, format="json", **self.auth_header
        )
        self.assertEqual(response.status_code, 400)
