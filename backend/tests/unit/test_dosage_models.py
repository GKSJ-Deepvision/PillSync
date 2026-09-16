from datetime import date, time
import pytest
from django.db import IntegrityError
from django.utils import timezone
from apps.accounts.models import User
from apps.medications.models import Medication, MedicationSchedule, MedicationHistory


@pytest.mark.django_db
def test_user_roles_and_properties():
    user = User.objects.create_user(
        username="john",
        email="john@example.com",
        password="password123",
        role=User.Role.PATIENT,
        name="John Doe",
    )
    assert user.is_patient is True
    assert user.is_caregiver is False
    assert user.is_platform_admin is False


@pytest.mark.django_db
def test_medication_and_schedule_creation():
    user = User.objects.create_user(
        username="jane",
        email="jane@example.com",
        password="password123",
    )
    med = Medication.objects.create(
        owner=user,
        name="Metformin",
        disease_category="diabetes",
        dosage="500mg",
        frequency="Twice daily",
        start_date=date.today(),
        quantity_remaining=60,
    )
    schedule = MedicationSchedule.objects.create(
        medication=med,
        time_of_day="morning",
        exact_time=time(8, 0),
        days_of_week=[0, 1, 2, 3, 4, 5, 6],
    )
    assert med.schedules.count() == 1
    assert schedule.window == "Morning"
    assert schedule.scheduled_time == time(8, 0)
    assert med.quantity == 60


@pytest.mark.django_db
def test_medication_history_duplicate_prevention():
    user = User.objects.create_user(
        username="sam",
        email="sam@example.com",
        password="password123",
    )
    med = Medication.objects.create(
        owner=user,
        name="Aspirin",
        dosage="100mg",
        start_date=date.today(),
    )
    schedule = MedicationSchedule.objects.create(
        medication=med,
        time_of_day="morning",
        exact_time=time(8, 0),
        days_of_week=[0, 1, 2, 3, 4, 5, 6],
    )
    scheduled_dt = timezone.now()

    # First entry
    MedicationHistory.objects.create(
        user=user,
        medication=med,
        dosage_schedule=schedule,
        scheduled_datetime=scheduled_dt,
        status=MedicationHistory.Status.TAKEN,
    )

    # Attempting to insert duplicate should raise IntegrityError
    with pytest.raises(IntegrityError):
        MedicationHistory.objects.create(
            user=user,
            medication=med,
            dosage_schedule=schedule,
            scheduled_datetime=scheduled_dt,
            status=MedicationHistory.Status.MISSED,
        )
