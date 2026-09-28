from datetime import date, datetime, time

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.medicines.models import MedicationHistory, Medicine, MedicineSchedule

from .services.adherence import calculate_adherence

User = get_user_model()


def scheduled_at(day, hour=8):
    return timezone.make_aware(datetime.combine(day, time(hour)))


class AdherenceServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="adherence-service-user",
            email="adherence-service@example.com",
        )
        self.medicine = Medicine.objects.create(user=self.user, name="Paracetamol")
        self.schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time=time(8),
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date=date(2026, 9, 1),
        )

    def create_history(self, day, status, hour=8):
        return MedicationHistory.objects.create(
            schedule=self.schedule,
            medicine=self.medicine,
            dose=self.schedule.dose,
            scheduled_at=scheduled_at(day, hour),
            status=status,
            taken_at=(
                scheduled_at(day, hour + 1) if status == MedicationHistory.Status.TAKEN else None
            ),
        )

    def test_calculates_taken_missed_and_percentage(self):
        self.create_history(date(2026, 9, 1), MedicationHistory.Status.TAKEN)
        self.create_history(date(2026, 9, 2), MedicationHistory.Status.MISSED)
        self.create_history(date(2026, 9, 3), MedicationHistory.Status.SKIPPED)

        result = calculate_adherence(self.user, medicine=self.medicine)

        self.assertEqual(result["total_scheduled"], 3)
        self.assertEqual(result["taken"], 1)
        self.assertEqual(result["missed"], 2)
        self.assertEqual(result["adherence_percentage"], 33.33)

    def test_zero_scheduled_doses_is_safe(self):
        result = calculate_adherence(self.user, medicine=self.medicine)

        self.assertEqual(result["total_scheduled"], 0)
        self.assertEqual(result["adherence_percentage"], 0.0)
        self.assertEqual(result["daily_breakdown"], [])

    def test_date_range_and_daily_breakdown(self):
        self.create_history(date(2026, 9, 1), MedicationHistory.Status.TAKEN)
        self.create_history(date(2026, 9, 2), MedicationHistory.Status.MISSED)
        self.create_history(date(2026, 9, 3), MedicationHistory.Status.TAKEN)

        result = calculate_adherence(
            self.user,
            medicine=self.medicine,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 2),
        )

        self.assertEqual(result["total_scheduled"], 2)
        self.assertEqual(result["taken"], 1)
        self.assertEqual(result["missed"], 1)
        self.assertEqual(result["daily_breakdown"][1]["date"], "2026-09-02")


class AdherenceAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="adherence-api-user",
            email="adherence-api@example.com",
        )
        self.other_user = User.objects.create_user(
            username="other-adherence-api-user",
            email="other-adherence-api@example.com",
        )
        self.medicine = Medicine.objects.create(user=self.user, name="My Medicine")
        self.other_medicine = Medicine.objects.create(user=self.other_user, name="Other Medicine")
        self.schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time=time(8),
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date=date(2026, 9, 1),
        )
        MedicationHistory.objects.create(
            schedule=self.schedule,
            medicine=self.medicine,
            dose="1 tablet",
            scheduled_at=scheduled_at(date(2026, 9, 1)),
            status=MedicationHistory.Status.TAKEN,
            taken_at=scheduled_at(date(2026, 9, 1), 9),
        )
        MedicationHistory.objects.create(
            schedule=self.schedule,
            medicine=self.medicine,
            dose="1 tablet",
            scheduled_at=scheduled_at(date(2026, 9, 2)),
            status=MedicationHistory.Status.MISSED,
        )

    def test_unauthenticated_requests_are_rejected(self):
        response = self.client.get("/api/adherence/")

        self.assertEqual(response.status_code, 401)

    def test_user_can_retrieve_overall_adherence(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/adherence/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_scheduled"], 2)
        self.assertEqual(response.data["taken"], 1)
        self.assertEqual(response.data["missed"], 1)
        self.assertEqual(response.data["adherence_percentage"], 50.0)

    def test_user_can_retrieve_medicine_adherence_with_date_range(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(
            f"/api/adherence/medicines/{self.medicine.id}/",
            {"start_date": "2026-09-01", "end_date": "2026-09-01"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["medicine"], self.medicine.id)
        self.assertEqual(response.data["total_scheduled"], 1)
        self.assertEqual(response.data["taken"], 1)

    def test_other_users_medicine_is_not_accessible(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f"/api/adherence/medicines/{self.other_medicine.id}/")

        self.assertEqual(response.status_code, 404)

    def test_invalid_date_range_returns_bad_request(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(
            "/api/adherence/",
            {"start_date": "2026-09-03", "end_date": "2026-09-01"},
        )

        self.assertEqual(response.status_code, 400)

    def test_invalid_date_format_returns_bad_request(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/adherence/", {"start_date": "not-a-date"})

        self.assertEqual(response.status_code, 400)

    def test_users_do_not_see_each_others_history_in_overall_stats(self):
        other_schedule = MedicineSchedule.objects.create(
            medicine=self.other_medicine,
            dose="1 tablet",
            time=time(8),
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date=date(2026, 9, 1),
        )
        MedicationHistory.objects.create(
            schedule=other_schedule,
            medicine=self.other_medicine,
            dose="1 tablet",
            scheduled_at=scheduled_at(date(2026, 9, 1)),
            status=MedicationHistory.Status.TAKEN,
            taken_at=scheduled_at(date(2026, 9, 1), 9),
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/adherence/")

        self.assertEqual(response.data["total_scheduled"], 2)
