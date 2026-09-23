from datetime import date, datetime, time
from secrets import token_urlsafe

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.adherence.models import DoseEvent, DoseEventStatus
from apps.adherence.services.metrics import (
    build_daily_history,
    calculate_medication_breakdown,
    calculate_status_breakdown,
    calculate_streak,
    calculate_summary,
)
from apps.medications.models import Dosage, MedicationSchedule, Medicine

User = get_user_model()


@pytest.fixture
def patient():
    return User.objects.create_user(
        email="adherence-test@example.com",
        full_name="Adherence Test Patient",
        password=token_urlsafe(24),
    )


@pytest.fixture
def medicine(patient):
    return Medicine.objects.create(
        patient=patient,
        medicine_name="Metformin",
        generic_name="Metformin",
        dosage=500,
        dosage_form="Tablet",
        quantity=30,
        disease_category="DIABETES",
        is_active=True,
    )


@pytest.fixture
def schedule(medicine):
    dosage = Dosage.objects.create(
        medicine=medicine,
        quantity=500,
        unit="mg",
    )

    return MedicationSchedule.objects.create(
        dosage=dosage,
        scheduled_time=time(8, 0),
        time_of_day=MedicationSchedule.TimeOfDay.MORNING,
        frequency="Once daily",
        repeat_rule=MedicationSchedule.RepeatRule.DAILY,
        start_date=date(2026, 9, 1),
        end_date=None,
    )


@pytest.mark.django_db
def test_taken_and_missed_doses_are_counted(
    patient,
    schedule,
):
    taken_date = date(2026, 9, 10)
    missed_date = date(2026, 9, 11)

    taken_at = timezone.make_aware(
        datetime.combine(
            taken_date,
            time(8, 5),
        )
    )

    missed_at = timezone.make_aware(
        datetime.combine(
            missed_date,
            time(23, 0),
        )
    )

    DoseEvent.objects.create(
        schedule=schedule,
        dose_date=taken_date,
        status=DoseEventStatus.TAKEN,
        taken_at=taken_at,
    )

    DoseEvent.objects.create(
        schedule=schedule,
        dose_date=missed_date,
        status=DoseEventStatus.MISSED,
        missed_at=missed_at,
    )

    history = build_daily_history(
        patient,
        taken_date,
        missed_date,
    )

    summary = calculate_summary(history)

    assert summary["scheduled_doses"] == 2
    assert summary["taken_doses"] == 1
    assert summary["missed_doses"] == 1
    assert summary["pending_doses"] == 0
    assert summary["adherence_rate"] == 50.0


@pytest.mark.django_db
def test_future_dose_does_not_reduce_adherence(
    patient,
    schedule,
    monkeypatch,
):
    frozen_now = timezone.make_aware(datetime(2026, 9, 10, 9, 0))

    monkeypatch.setattr(
        "apps.adherence.services.metrics._current_local_datetime",
        lambda: frozen_now,
    )

    taken_at = timezone.make_aware(datetime(2026, 9, 10, 8, 5))

    DoseEvent.objects.create(
        schedule=schedule,
        dose_date=date(2026, 9, 10),
        status=DoseEventStatus.TAKEN,
        taken_at=taken_at,
    )

    history = build_daily_history(
        patient,
        date(2026, 9, 10),
        date(2026, 9, 10),
    )

    summary = calculate_summary(history)

    assert summary["scheduled_doses"] == 1
    assert summary["taken_doses"] == 1
    assert summary["missed_doses"] == 0
    assert summary["pending_doses"] == 0
    assert summary["adherence_rate"] == 100.0


@pytest.mark.django_db
def test_medication_breakdown_is_calculated(
    patient,
    schedule,
):
    first_date = date(2026, 9, 10)
    second_date = date(2026, 9, 11)

    DoseEvent.objects.create(
        schedule=schedule,
        dose_date=first_date,
        status=DoseEventStatus.TAKEN,
        taken_at=timezone.make_aware(
            datetime.combine(
                first_date,
                time(8, 5),
            )
        ),
    )

    DoseEvent.objects.create(
        schedule=schedule,
        dose_date=second_date,
        status=DoseEventStatus.MISSED,
        missed_at=timezone.make_aware(
            datetime.combine(
                second_date,
                time(23, 0),
            )
        ),
    )

    result = calculate_medication_breakdown(
        patient,
        first_date,
        second_date,
    )

    assert len(result) == 1
    assert result[0]["medicine_name"] == "Metformin"
    assert result[0]["scheduled_doses"] == 2
    assert result[0]["taken_doses"] == 1
    assert result[0]["missed_doses"] == 1
    assert result[0]["adherence_rate"] == 50.0


def test_status_breakdown():
    history = [
        {
            "date": date(2026, 9, 10),
            "scheduled": 3,
            "taken": 2,
            "missed": 1,
            "pending": 0,
        },
        {
            "date": date(2026, 9, 11),
            "scheduled": 3,
            "taken": 1,
            "missed": 0,
            "pending": 2,
        },
    ]

    result = calculate_status_breakdown(history)

    assert result == {
        "taken": 3,
        "missed": 1,
        "pending": 2,
    }


def test_streak_counts_consecutive_perfect_days():
    history = [
        {
            "date": date(2026, 9, 8),
            "scheduled": 2,
            "taken": 2,
            "missed": 0,
            "pending": 0,
        },
        {
            "date": date(2026, 9, 9),
            "scheduled": 2,
            "taken": 2,
            "missed": 0,
            "pending": 0,
        },
        {
            "date": date(2026, 9, 10),
            "scheduled": 2,
            "taken": 1,
            "missed": 1,
            "pending": 0,
        },
    ]

    result = calculate_streak(history)

    assert result == 0
