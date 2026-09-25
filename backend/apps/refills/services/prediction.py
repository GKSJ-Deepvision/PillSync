from datetime import date, timedelta
from math import ceil


def calculate_refill_prediction(
    stock_quantity: int,
    quantity_per_dose: int,
    frequency_per_day: int,
    missed_doses: int = 0,
    manual_stock_adjustment: int = 0,
    refill_buffer_days: int = 5,
):
    """Calculate medicine consumption and refill dates."""

    if stock_quantity < 0:
        raise ValueError("Stock quantity cannot be negative.")

    if quantity_per_dose <= 0:
        raise ValueError("Quantity per dose must be greater than 0.")

    if frequency_per_day <= 0:
        raise ValueError("Frequency per day must be greater than 0.")

    if missed_doses < 0:
        raise ValueError("Missed doses cannot be negative.")

    adjusted_stock = stock_quantity + manual_stock_adjustment

    if adjusted_stock < 0:
        raise ValueError("Adjusted stock cannot be negative.")

    daily_consumption = quantity_per_dose * frequency_per_day

    missed_consumption = missed_doses * quantity_per_dose

    days_remaining = adjusted_stock / daily_consumption

    estimated_depletion_date = date.today() + timedelta(
        days=ceil(days_remaining)
    )

    recommended_refill_date = (
        estimated_depletion_date
        - timedelta(days=refill_buffer_days)
    )

    # Low-stock alert
    low_stock_threshold_days = 5
    is_low_stock = days_remaining <= low_stock_threshold_days

    low_stock_message = None

    if is_low_stock:
        low_stock_message = (
            "Your medicine stock is low. "
            "Please arrange a refill."
        )

    return {
        "remaining_stock": adjusted_stock,
        "average_daily_consumption": daily_consumption,
        "days_remaining": round(days_remaining, 2),
        "missed_doses": missed_doses,
        "missed_consumption": missed_consumption,
        "estimated_depletion_date": estimated_depletion_date,
        "recommended_refill_date": recommended_refill_date,
        "low_stock_alert": is_low_stock,
        "low_stock_message": low_stock_message,
    }


def get_missed_doses(reminders):
    """Count missed reminders from reminder history."""

    return reminders.filter(
        status="MISSED"
    ).count()