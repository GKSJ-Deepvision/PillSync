from datetime import date

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.prescriptions.models import Prescription
from apps.profiles.models import PatientProfile


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def patient_profile(db):
    user = User.objects.create_user(
        email="patient_rx@example.com",
        full_name="Patient Rx",
        password="password123",  # pragma: allowlist secret
        role=UserRole.PATIENT,
    )
    return PatientProfile.objects.create(
        user=user,
        first_name="Patient",
        last_name="Rx",
        date_of_birth=date(1990, 1, 1),
    )


@pytest.mark.django_db
class TestPrescriptions:
    def test_create_prescription(self, api_client, patient_profile):
        api_client.force_authenticate(user=patient_profile.user)
        data = {
            "patient": patient_profile.id,
            "doctor_name": "Smith",
            "clinic_name": "City Health",
            "diagnosis": "Hypertension",
            "issue_date": "2026-01-15",
            "expiration_date": "2026-07-15",
            "notes": "Take with water",
        }
        response = api_client.post("/api/prescriptions/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert Prescription.objects.filter(doctor_name="Smith").exists()

    def test_list_prescriptions(self, api_client, patient_profile):
        api_client.force_authenticate(user=patient_profile.user)
        Prescription.objects.create(
            patient=patient_profile,
            doctor_name="Jones",
            issue_date=date(2026, 2, 1),
        )
        response = api_client.get("/api/prescriptions/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
