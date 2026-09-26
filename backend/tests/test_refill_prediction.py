from datetime import date, time

from app.models.dosage_schedule import DosageSchedule
from app.models.medicine import Medicine
from app.services.refill_prediction import (
    calculate_daily_consumption,
    calculate_refill_prediction,
)


def create_medicine(quantity: int = 60) -> Medicine:
    return Medicine(
        id=1,
        patient_id=1,
        name="Test Medicine",
        dosage="500 mg",
        quantity=quantity,
        frequency="daily",
    )


def create_schedule(
    dosage_amount: int = 2,
    frequency: str = "daily",
) -> DosageSchedule:
    return DosageSchedule(
        id=1,
        medicine_id=1,
        dosage_amount=dosage_amount,
        time_of_day=time(8, 0),
        frequency=frequency,
    )


def test_calculate_daily_consumption_for_daily_schedule():
    schedule = create_schedule(
        dosage_amount=2,
        frequency="daily",
    )

    result = calculate_daily_consumption([schedule])

    assert result == 2


def test_calculate_daily_consumption_for_twice_daily_schedule():
    schedule = create_schedule(
        dosage_amount=2,
        frequency="twice daily",
    )

    result = calculate_daily_consumption([schedule])

    assert result == 4


def test_calculate_daily_consumption_for_multiple_schedules():
    morning = create_schedule(
        dosage_amount=1,
        frequency="daily",
    )

    night = DosageSchedule(
        id=2,
        medicine_id=1,
        dosage_amount=1,
        time_of_day=time(20, 0),
        frequency="daily",
    )

    result = calculate_daily_consumption([morning, night])

    assert result == 2


def test_refill_prediction_calculates_depletion_date():
    medicine = create_medicine(quantity=60)

    schedule = create_schedule(
        dosage_amount=2,
        frequency="daily",
    )

    result = calculate_refill_prediction(
        medicine=medicine,
        schedules=[schedule],
        prediction_date=date(2026, 9, 26),
    )

    assert result["current_stock"] == 60
    assert result["daily_consumption"] == 2
    assert result["estimated_days_remaining"] == 30
    assert result["estimated_depletion_date"] == date(
        2026,
        10,
        26,
    )


def test_refill_prediction_calculates_recommended_refill_date():
    medicine = create_medicine(quantity=60)

    schedule = create_schedule(
        dosage_amount=2,
        frequency="daily",
    )

    result = calculate_refill_prediction(
        medicine=medicine,
        schedules=[schedule],
        prediction_date=date(2026, 9, 26),
        refill_threshold_days=7,
    )

    assert result["recommended_refill_date"] == date(
        2026,
        10,
        19,
    )


def test_refill_prediction_flags_low_stock():
    medicine = create_medicine(quantity=10)

    schedule = create_schedule(
        dosage_amount=2,
        frequency="daily",
    )

    result = calculate_refill_prediction(
        medicine=medicine,
        schedules=[schedule],
        prediction_date=date(2026, 9, 26),
        refill_threshold_days=7,
    )

    assert result["estimated_days_remaining"] == 5
    assert result["refill_required"] is True


def test_refill_prediction_does_not_flag_sufficient_stock():
    medicine = create_medicine(quantity=60)

    schedule = create_schedule(
        dosage_amount=2,
        frequency="daily",
    )

    result = calculate_refill_prediction(
        medicine=medicine,
        schedules=[schedule],
        prediction_date=date(2026, 9, 26),
        refill_threshold_days=7,
    )

    assert result["refill_required"] is False


def test_refill_prediction_without_schedule():
    medicine = create_medicine(quantity=60)

    result = calculate_refill_prediction(
        medicine=medicine,
        schedules=[],
        prediction_date=date(2026, 9, 26),
    )

    assert result["daily_consumption"] == 0
    assert result["estimated_days_remaining"] is None
    assert result["estimated_depletion_date"] is None
    assert result["recommended_refill_date"] is None
    assert result["refill_required"] is False
