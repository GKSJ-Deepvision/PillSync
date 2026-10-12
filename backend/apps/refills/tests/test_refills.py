from datetime import date
from decimal import Decimal

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.medications.models import Medicine
from apps.profiles.models import PatientProfile
from apps.refills.models import RefillRequest
from apps.refills.services.prediction import calculate_refill_prediction


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def patient_and_medicine(db):
    user = User.objects.create_user(
        email="patient_refill@example.com",
        full_name="Patient Refill",
        password="password123",  # pragma: allowlist secret
        role=UserRole.PATIENT,
    )
    patient = PatientProfile.objects.create(
        user=user,
        first_name="Patient",
        last_name="Refill",
        date_of_birth=date(1990, 1, 1),
    )
    med = Medicine.objects.create(
        patient=patient,
        name="Metformin",
        quantity_remaining=Decimal("30"),
        low_stock_threshold=Decimal("5"),
    )
    return patient, med


@pytest.mark.django_db
class TestRefills:
    def test_calculate_refill_prediction(self, patient_and_medicine):
        _, med = patient_and_medicine
        prediction = calculate_refill_prediction(med)
        assert prediction["medicine_id"] == med.id
        assert prediction["days_remaining"] == 30
        assert not prediction["is_low_stock"]

    def test_refill_prediction_low_stock(self, patient_and_medicine):
        _, med = patient_and_medicine
        med.quantity_remaining = Decimal("3")
        med.save()
        prediction = calculate_refill_prediction(med)
        assert prediction["is_low_stock"] is True
        assert prediction["days_remaining"] == 3

    def test_refill_request_create_and_list(self, api_client, patient_and_medicine):
        patient, med = patient_and_medicine
        api_client.force_authenticate(user=patient.user)

        data = {
            "patient": patient.id,
            "medicine": med.id,
            "quantity": 30,
            "notes": "Need one month supply",
        }
        res_create = api_client.post("/api/refills/", data, format="json")
        assert res_create.status_code == status.HTTP_201_CREATED
        assert RefillRequest.objects.filter(medicine=med).exists()

        res_list = api_client.get("/api/refills/")
        assert res_list.status_code == status.HTTP_200_OK
        assert len(res_list.data) >= 1
