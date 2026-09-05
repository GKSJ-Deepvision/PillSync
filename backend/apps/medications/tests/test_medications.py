from datetime import date, time

import pytest
from rest_framework.test import APIClient

from apps.medications.models import Dosage, MedicationSchedule, Medicine
from apps.profiles.models import PatientProfile


@pytest.mark.django_db
def test_create_medicine():
    patient = PatientProfile.objects.create(
        first_name="Test",
        last_name="Patient",
        date_of_birth=date(1995, 1, 1),
    )

    medicine = Medicine.objects.create(
        patient=patient,
        name="Metformin",
        category="diabetes",
        quantity_remaining=30,
    )

    assert medicine.name == "Metformin"
    assert medicine.category == "diabetes"
    assert medicine.quantity_remaining == 30


@pytest.mark.django_db
def test_medicine_stock():
    patient = PatientProfile.objects.create(
        first_name="Stock",
        last_name="Test",
        date_of_birth=date(1995, 1, 1),
    )

    medicine = Medicine.objects.create(
        patient=patient,
        name="Vitamin D",
        category="vitamins",
        quantity_remaining=10,
    )

    medicine.restock(20)
    medicine.refresh_from_db()
    assert medicine.quantity_remaining == 30

    medicine.consume(5)
    medicine.refresh_from_db()
    assert medicine.quantity_remaining == 25

    medicine.consume(25)
    medicine.refresh_from_db()
    assert medicine.quantity_remaining == 0


@pytest.mark.django_db
def test_medication_schedule():
    patient = PatientProfile.objects.create(
        first_name="Schedule",
        last_name="Test",
        date_of_birth=date(1995, 1, 1),
    )

    medicine = Medicine.objects.create(
        patient=patient,
        name="Amoxicillin",
        category="antibiotics",
    )

    dosage = Dosage.objects.create(
        medicine=medicine,
        amount=500,
        unit="mg",
    )

    schedule = MedicationSchedule.objects.create(
        medicine=medicine,
        dosage=dosage,
        slot="morning",
        time_of_day=time(8, 0),
        quantity_per_dose=1,
        frequency="daily",
    )
    assert schedule.occurs_on(date.today()) is False


@pytest.mark.django_db
def test_medicine_api():
    patient = PatientProfile.objects.create(
        first_name="API",
        last_name="Test",
        date_of_birth=date(1995, 1, 1),
    )

    Medicine.objects.create(
        patient=patient,
        name="Levothyroxine",
        category="thyroid",
        quantity_remaining=20,
    )

    client = APIClient()
    response = client.get("/api/medications/medicines/")

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["name"] == "Levothyroxine"


@pytest.mark.django_db
def test_stock_service():
    from apps.medications.services.scheduling import update_stock

    patient = PatientProfile.objects.create(
        first_name="Service",
        last_name="Test",
        date_of_birth=date(1995, 1, 1),
    )

    medicine = Medicine.objects.create(
        patient=patient,
        name="Atenolol",
        category="heart",
        quantity_remaining=10,
    )

    update_stock(medicine, 15)
    medicine.refresh_from_db()

    assert medicine.quantity_remaining == 25

    with pytest.raises(ValueError):
        update_stock(medicine, -30)
