from datetime import date, time

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.medications.models import MedicationSchedule, Medicine
from apps.profiles.models import PatientProfile
from apps.reminders.models import Reminder, ReminderStatus
from apps.reminders.services.reminder_service import (
    create_reminder_for_schedule,
    create_today_reminders,
)


@pytest.mark.django_db
def test_create_reminder_for_schedule():
    patient = PatientProfile.objects.create(
        first_name="Test",
        last_name="Patient",
        date_of_birth=date(1990, 1, 1),
    )

    medicine = Medicine.objects.create(
        patient=patient,
        name="Paracetamol",
        quantity_remaining=20,
        quantity_per_refill=20,
        low_stock_threshold=5,
        start_date=date.today(),
    )

    schedule = MedicationSchedule.objects.create(
        medicine=medicine,
        time_of_day=time(8, 0),
        quantity_per_dose=1,
        remind_minutes_before=30,
    )

    reminder = create_reminder_for_schedule(schedule, date.today())

    assert reminder is not None
    assert reminder.schedule == schedule
    assert reminder.dose_datetime == timezone.make_aware(
        timezone.datetime.combine(date.today(), time(8, 0))
    )
    assert reminder.reminder_datetime == timezone.make_aware(
        timezone.datetime.combine(date.today(), time(7, 30))
    )
    assert reminder.status == ReminderStatus.PENDING
    assert "Paracetamol" in reminder.message


@pytest.mark.django_db
def test_does_not_create_reminder_when_disabled():
    patient = PatientProfile.objects.create(
        first_name="Test",
        last_name="Patient",
        date_of_birth=date(1990, 1, 1),
    )

    medicine = Medicine.objects.create(
        patient=patient,
        name="Vitamin D",
        quantity_remaining=10,
        quantity_per_refill=10,
        low_stock_threshold=2,
        start_date=date.today(),
    )

    schedule = MedicationSchedule.objects.create(
        medicine=medicine,
        time_of_day=time(9, 0),
        reminder_enabled=False,
    )

    reminder = create_reminder_for_schedule(schedule, date.today())

    assert reminder is None
    assert Reminder.objects.count() == 0


@pytest.mark.django_db
def test_does_not_create_reminder_when_schedule_does_not_occur():
    patient = PatientProfile.objects.create(
        first_name="Test",
        last_name="Patient",
        date_of_birth=date(1990, 1, 1),
    )

    medicine = Medicine.objects.create(
        patient=patient,
        name="Antibiotic",
        quantity_remaining=10,
        quantity_per_refill=10,
        low_stock_threshold=2,
        start_date=date.today(),
    )

    schedule = MedicationSchedule.objects.create(
        medicine=medicine,
        time_of_day=time(10, 0),
        frequency="SPECIFIC_DAYS",
        days_of_week=[7],
    )

    reminder = create_reminder_for_schedule(schedule, date.today())

    if date.today().isoweekday() != 7:
        assert reminder is None


@pytest.mark.django_db
def test_does_not_create_duplicate_reminder():
    patient = PatientProfile.objects.create(
        first_name="Test",
        last_name="Patient",
        date_of_birth=date(1990, 1, 1),
    )

    medicine = Medicine.objects.create(
        patient=patient,
        name="Aspirin",
        quantity_remaining=20,
        quantity_per_refill=20,
        low_stock_threshold=5,
        start_date=date.today(),
    )

    schedule = MedicationSchedule.objects.create(
        medicine=medicine,
        time_of_day=time(8, 0),
    )

    first = create_reminder_for_schedule(schedule, date.today())
    second = create_reminder_for_schedule(schedule, date.today())

    assert first.pk == second.pk
    assert Reminder.objects.count() == 1


@pytest.mark.django_db
def test_create_today_reminders():
    patient = PatientProfile.objects.create(
        first_name="Test",
        last_name="Patient",
        date_of_birth=date(1990, 1, 1),
    )

    medicine = Medicine.objects.create(
        patient=patient,
        name="Metformin",
        quantity_remaining=30,
        quantity_per_refill=30,
        low_stock_threshold=5,
        start_date=date.today(),
    )

    MedicationSchedule.objects.create(
        medicine=medicine,
        time_of_day=time(8, 0),
    )

    MedicationSchedule.objects.create(
        medicine=medicine,
        time_of_day=time(20, 0),
    )

    reminders = create_today_reminders(
        patient.id,
        date.today(),
    )

    assert len(reminders) == 2
    assert Reminder.objects.filter(schedule__medicine=medicine).count() == 2


@pytest.mark.django_db
def test_reminder_list_api():
    patient = PatientProfile.objects.create(
        first_name="API",
        last_name="Test",
        date_of_birth=date(1995, 1, 1),
    )

    medicine = Medicine.objects.create(
        patient=patient,
        name="Metformin",
        category="diabetes",
    )

    schedule = MedicationSchedule.objects.create(
        medicine=medicine,
        time_of_day=time(8, 0),
    )

    reminder = create_reminder_for_schedule(
        schedule,
        date.today(),
    )

    client = APIClient()
    response = client.get(
        "/api/reminders/",
        {"patient_id": patient.id},
    )

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["id"] == reminder.id
    assert response.data[0]["medicine_name"] == "Metformin"


@pytest.mark.django_db
def test_today_reminder_api():
    patient = PatientProfile.objects.create(
        first_name="Today",
        last_name="Test",
        date_of_birth=date(1995, 1, 1),
    )

    medicine = Medicine.objects.create(
        patient=patient,
        name="Aspirin",
        category="heart",
    )

    schedule = MedicationSchedule.objects.create(
        medicine=medicine,
        time_of_day=time(9, 0),
    )

    create_reminder_for_schedule(
        schedule,
        date.today(),
    )

    client = APIClient()
    response = client.get(
        "/api/reminders/today/",
        {"patient_id": patient.id},
    )

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["medicine_name"] == "Aspirin"


@pytest.mark.django_db
def test_upcoming_reminder_api():
    patient = PatientProfile.objects.create(
        first_name="Upcoming",
        last_name="Test",
        date_of_birth=date(1995, 1, 1),
    )

    medicine = Medicine.objects.create(
        patient=patient,
        name="Levothyroxine",
        category="thyroid",
    )

    schedule = MedicationSchedule.objects.create(
        medicine=medicine,
        time_of_day=time(8, 0),
    )

    create_reminder_for_schedule(
        schedule,
        date.today(),
    )

    client = APIClient()
    response = client.get(
        "/api/reminders/upcoming/",
        {"patient_id": patient.id},
    )

    assert response.status_code == 200


@pytest.mark.django_db
def test_update_reminder_status_api():
    patient = PatientProfile.objects.create(
        first_name="Status",
        last_name="Test",
        date_of_birth=date(1995, 1, 1),
    )

    medicine = Medicine.objects.create(
        patient=patient,
        name="Vitamin D",
        category="vitamins",
    )

    schedule = MedicationSchedule.objects.create(
        medicine=medicine,
        time_of_day=time(10, 0),
    )

    reminder = create_reminder_for_schedule(
        schedule,
        date.today(),
    )

    client = APIClient()
    response = client.patch(
        f"/api/reminders/{reminder.id}/status/",
        {
            "patient_id": patient.id,
            "status": ReminderStatus.TAKEN,
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["status"] == ReminderStatus.TAKEN

    reminder.refresh_from_db()

    assert reminder.status == ReminderStatus.TAKEN
    assert reminder.taken_at is not None
