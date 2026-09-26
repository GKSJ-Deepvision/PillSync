from datetime import date, timedelta
from math import ceil

from app.models.dosage_schedule import DosageSchedule
from app.models.medicine import Medicine


DEFAULT_REFILL_THRESHOLD_DAYS = 7


def calculate_daily_consumption(
    schedules: list[DosageSchedule],
) -> int:
    """
    Calculate the expected number of medicine units consumed per day.

    Daily schedules:
        dosage_amount is consumed once per day.

    Twice-daily schedules:
        dosage_amount is consumed twice per day.

    Every-other-day schedules:
        dosage_amount is consumed every two days.

    Weekly schedules:
        dosage_amount is consumed once every seven days.
    """

    daily_consumption = 0

    for schedule in schedules:
        frequency = schedule.frequency.strip().lower()

        if frequency == "daily":
            daily_consumption += schedule.dosage_amount

        elif frequency in {"twice daily", "2x daily"}:
            daily_consumption += schedule.dosage_amount * 2

        elif frequency in {"three times daily", "3x daily"}:
            daily_consumption += schedule.dosage_amount * 3

        elif frequency in {
            "every other day",
            "alternate days",
            "alternate day",
        }:
            daily_consumption += schedule.dosage_amount / 2

        elif frequency == "weekly":
            daily_consumption += schedule.dosage_amount / 7

    return daily_consumption


def calculate_refill_prediction(
    medicine: Medicine,
    schedules: list[DosageSchedule],
    prediction_date: date | None = None,
    refill_threshold_days: int = DEFAULT_REFILL_THRESHOLD_DAYS,
) -> dict:
    """
    Calculate refill information for a medicine.

    Returns:
        current_stock
        daily_consumption
        estimated_days_remaining
        estimated_depletion_date
        recommended_refill_date
        refill_required
    """

    if prediction_date is None:
        prediction_date = date.today()

    if refill_threshold_days < 0:
        raise ValueError(
            "Refill threshold cannot be negative."
        )

    if medicine.quantity < 0:
        raise ValueError(
            "Medicine quantity cannot be negative."
        )

    daily_consumption = calculate_daily_consumption(schedules)

    if daily_consumption <= 0:
        return {
            "current_stock": medicine.quantity,
            "daily_consumption": 0,
            "estimated_days_remaining": None,
            "estimated_depletion_date": None,
            "recommended_refill_date": None,
            "refill_required": False,
        }

    estimated_days_remaining = ceil(
        medicine.quantity / daily_consumption
    )

    estimated_depletion_date = (
        prediction_date
        + timedelta(days=estimated_days_remaining)
    )

    recommended_refill_date = (
        estimated_depletion_date
        - timedelta(days=refill_threshold_days)
    )

    refill_required = (
        estimated_days_remaining
        <= refill_threshold_days
    )

    return {
        "current_stock": medicine.quantity,
        "daily_consumption": daily_consumption,
        "estimated_days_remaining": estimated_days_remaining,
        "estimated_depletion_date": estimated_depletion_date,
        "recommended_refill_date": recommended_refill_date,
        "refill_required": refill_required,
    }