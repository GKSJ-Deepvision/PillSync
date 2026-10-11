import datetime

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.prescriptions.models import Prescription
from apps.profiles.models import PatientProfile


@pytest.mark.django_db
def test_prescription_lifecycle():
    client = APIClient()
    user = User.objects.create_user(
        username="rx_user",
        email="rx@example.com",
        password="dummy_rx_password_123",  # pragma: allowlist secret
        role=User.Role.PATIENT,
    )
    profile = PatientProfile.objects.create(
        user=user,
        name="Rx Patient",
        relationship="Self",
    )

    rx = Prescription.objects.create(
        patient_profile=profile,
        doctor_name="Dr. Gregory House",
        clinic_name="Princeton-Plainsboro",
        issue_date=datetime.date.today(),
        expiry_date=datetime.date.today() + datetime.timedelta(days=90),
        notes="Take with food",
    )
    assert rx.id is not None

    client.force_authenticate(user=user)
    res = client.get("/api/prescriptions/")
    assert res.status_code == status.HTTP_200_OK
    assert len(res.data) >= 1
    assert res.data[0]["doctor_name"] == "Dr. Gregory House"
