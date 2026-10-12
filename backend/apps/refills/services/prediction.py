from datetime import date, timedelta
from decimal import Decimal


def calculate_refill_prediction(medicine):
    """
    Inputs: current stock quantity, schedules, and consumption rate.
    Computes: remaining days, estimated depletion date, recommended refill date.
    """
    quantity_remaining = Decimal(str(medicine.quantity_remaining or 0))

    # Calculate daily dose from active medication schedules
    daily_consumption = Decimal("0")
    schedules = medicine.schedules.filter(is_active=True)

    for schedule in schedules:
        dose_quantity = Decimal(str(schedule.dose_quantity or 1))
        # Daily schedule adds doses per slot or frequency
        daily_consumption += dose_quantity

    # Default to 1 tablet/day if no schedules configured yet
    if daily_consumption <= Decimal("0"):
        daily_consumption = Decimal("1")

    days_remaining = int(quantity_remaining / daily_consumption)
    depletion_date = date.today() + timedelta(days=days_remaining)
    # Recommend refill 5 days before stock runs out (or today if < 5 days)
    refill_lead_days = max(0, days_remaining - 5)
    recommended_refill_date = date.today() + timedelta(days=refill_lead_days)

    is_low_stock = quantity_remaining <= Decimal(str(medicine.low_stock_threshold or 5))

    return {
        "medicine_id": medicine.id,
        "medicine_name": medicine.name,
        "quantity_remaining": float(quantity_remaining),
        "daily_consumption_rate": float(daily_consumption),
        "days_remaining": days_remaining,
        "estimated_depletion_date": depletion_date.isoformat(),
        "recommended_refill_date": recommended_refill_date.isoformat(),
        "is_low_stock": is_low_stock,
    }
