from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.medicines.models import MedicationHistory, Medicine, MedicineSchedule
from apps.refills.models import RefillPrediction

User = get_user_model()


class DashboardAnalyticsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="analytics-user",
            email="analytics@example.com",
            password="test-password-123",
        )
        self.other_user = User.objects.create_user(
            username="other-user",
            email="other@example.com",
            password="test-password-123",
        )
        self.client.force_authenticate(self.user)
        self.medicine = Medicine.objects.create(
            user=self.user,
            name="Vitamin D",
            dosage="1 tablet",
            quantity=2,
            refill_threshold=5,
        )
        self.schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time="08:00:00",
            start_date=timezone.localdate() - timedelta(days=2),
        )

    def test_dashboard_aggregates_owned_data(self):
        now = timezone.now()
        MedicationHistory.objects.create(
            schedule=self.schedule,
            medicine=self.medicine,
            dose="1 tablet",
            scheduled_at=now - timedelta(days=1),
            status=MedicationHistory.Status.TAKEN,
            taken_at=now - timedelta(days=1),
        )
        MedicationHistory.objects.create(
            schedule=self.schedule,
            medicine=self.medicine,
            dose="1 tablet",
            scheduled_at=now,
            status=MedicationHistory.Status.MISSED,
        )
        RefillPrediction.objects.create(
            medicine=self.medicine,
            daily_consumption=1,
            days_remaining=2,
            predicted_refill_date=timezone.localdate() + timedelta(days=2),
        )

        response = self.client.get("/api/analytics/dashboard/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["summary"]["adherence_percentage"], 50.0)
        self.assertEqual(response.data["history"]["total"], 2)
        self.assertEqual(response.data["active_medicines"][0]["is_low_stock"], True)
        self.assertEqual(
            response.data["active_medicines"][0]["refill_prediction"]["days_remaining"],
            2,
        )

    def test_dashboard_does_not_expose_other_users(self):
        Medicine.objects.create(user=self.other_user, name="Private medicine")

        response = self.client.get("/api/analytics/dashboard/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["active_medicines"]), 1)
        self.assertEqual(response.data["active_medicines"][0]["name"], "Vitamin D")

    def test_dashboard_requires_authentication_and_valid_dates(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(
            self.client.get("/api/analytics/dashboard/").status_code,
            401,
        )

        self.client.force_authenticate(self.user)
        response = self.client.get(
            "/api/analytics/dashboard/?start_date=2026-99-01",
        )
        self.assertEqual(response.status_code, 400)
