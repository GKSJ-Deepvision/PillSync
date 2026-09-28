from datetime import date, time
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.medications.models import MedicationSchedule, Medicine
from apps.profiles.models import PatientProfile
from apps.refills.services.prediction import analyze_dosage, predict_refill

pytestmark = pytest.mark.django_db


@pytest.fixture
def patient():
    return PatientProfile.objects.create(
        first_name="Test",
        last_name="Patient",
        date_of_birth=date(1990, 1, 1),
    )


@pytest.fixture
def medicine(patient):
    return Medicine.objects.create(
        patient=patient,
        name="Test Medicine",
        strength="500",
        strength_unit="mg",
        quantity_remaining=Decimal("60"),
        low_stock_threshold=Decimal("5"),
    )


def add_schedule(medicine, quantity="2"):
    return MedicationSchedule.objects.create(
        medicine=medicine,
        time_of_day=time(8, 0),
        quantity_per_dose=Decimal(quantity),
        start_date=date.today(),
    )


def test_spec_example_60_tablets_at_2_per_day(medicine):
    add_schedule(medicine, "2")

    result = predict_refill(medicine)

    assert result["daily_stock_consumption"] == 2.0
    assert result["days_remaining"] == 30.0
    assert result["status"] == "OK"


def test_multiple_daily_doses_are_aggregated(medicine):
    add_schedule(medicine, "1")
    MedicationSchedule.objects.create(
        medicine=medicine,
        time_of_day=time(20, 0),
        quantity_per_dose=Decimal("1"),
        start_date=date.today(),
        slot="NIGHT",
    )

    result = analyze_dosage(medicine)

    assert result["daily_stock_consumption"] == 2.0
    assert len(result["schedules"]) == 2


def test_refill_due_when_supply_is_within_lead_window(medicine):
    medicine.quantity_remaining = Decimal("10")
    medicine.save(update_fields=["quantity_remaining"])
    add_schedule(medicine, "2")

    result = predict_refill(medicine, lead_days=5)

    assert result["days_remaining"] == 5.0
    assert result["status"] == "REFILL_DUE"


def test_low_stock(medicine):
    medicine.quantity_remaining = Decimal("4")
    medicine.save(update_fields=["quantity_remaining"])
    add_schedule(medicine, "0.1")

    result = predict_refill(medicine, lead_days=5)

    assert result["status"] == "LOW_STOCK"


def test_out_of_stock(medicine):
    medicine.quantity_remaining = Decimal("0")
    medicine.save(update_fields=["quantity_remaining"])
    add_schedule(medicine, "1")

    result = predict_refill(medicine)

    assert result["status"] == "OUT_OF_STOCK"
    assert result["days_remaining"] == 0.0


def test_no_active_dosage(medicine):
    result = predict_refill(medicine)

    assert result["status"] == "NO_ACTIVE_DOSAGE"
    assert result["predicted_depletion_date"] is None


def test_prediction_api(patient, medicine):
    add_schedule(medicine, "2")
    response = APIClient().get(
        "/api/refills/predictions/",
        {"patient": patient.id},
    )

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["predictions"][0]["days_remaining"] == 30.0


def test_dosage_analysis_api(patient, medicine):
    add_schedule(medicine, "2")
    response = APIClient().get(
        "/api/refills/dosage-analysis/",
        {"patient": patient.id},
    )

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["medications"][0]["daily_stock_consumption"] == 2.0
