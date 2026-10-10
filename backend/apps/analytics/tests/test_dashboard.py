from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import CaregiverPatientRelationship
from apps.medicines.models import MedicationHistory, Medicine, MedicineSchedule
from apps.refills.models import RefillPrediction

User = get_user_model()


class DashboardAnalyticsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="analytics-user",
            email="analytics@example.com",
        )
        self.other_user = User.objects.create_user(
            username="other-user",
            email="other@example.com",
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


class CaregiverDashboardAnalyticsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.caregiver = User.objects.create_user(
            username="caregiver",
            email="caregiver@example.com",
            role=User.Role.CAREGIVER,
        )
        self.patient = User.objects.create_user(
            username="patient",
            email="patient@example.com",
        )
        self.other_patient = User.objects.create_user(
            username="other-patient",
            email="other-patient@example.com",
        )
        self.medicine = Medicine.objects.create(
            user=self.patient,
            name="Patient medicine",
            quantity=1,
        )
        self.schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time="08:00:00",
            start_date=timezone.localdate(),
        )
        CaregiverPatientRelationship.objects.create(
            caregiver=self.caregiver,
            patient=self.patient,
        )

    def test_authorized_caregiver_gets_only_target_patient_dashboard(self):
        MedicationHistory.objects.create(
            schedule=self.schedule,
            medicine=self.medicine,
            dose="1 tablet",
            scheduled_at=timezone.now(),
            status=MedicationHistory.Status.TAKEN,
        )
        self.client.force_authenticate(self.caregiver)

        response = self.client.get(
            f"/api/analytics/caregiver/patients/{self.patient.id}/dashboard/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["active_medicines"][0]["name"],
            "Patient medicine",
        )
        self.assertEqual(response.data["history"]["total"], 1)

    def test_unassigned_patient_and_non_caregiver_are_not_disclosed(self):
        self.client.force_authenticate(self.caregiver)
        self.assertEqual(
            self.client.get(
                f"/api/analytics/caregiver/patients/{self.other_patient.id}/dashboard/"
            ).status_code,
            404,
        )

        self.client.force_authenticate(self.patient)
        self.assertEqual(
            self.client.get(
                f"/api/analytics/caregiver/patients/{self.patient.id}/dashboard/"
            ).status_code,
            404,
        )

    def test_invalid_date_validation_is_preserved(self):
        self.client.force_authenticate(self.caregiver)
        response = self.client.get(
            f"/api/analytics/caregiver/patients/{self.patient.id}/dashboard/"
            "?start_date=2026-99-01"
        )
        self.assertEqual(response.status_code, 400)

    def test_revoked_assignment_blocks_dashboard_access(self):
        relationship = CaregiverPatientRelationship.objects.get(
            caregiver=self.caregiver,
            patient=self.patient,
        )
        relationship.delete()
        self.client.force_authenticate(self.caregiver)

        response = self.client.get(
            f"/api/analytics/caregiver/patients/{self.patient.id}/dashboard/"
        )

        self.assertEqual(response.status_code, 404)
