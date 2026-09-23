"""
Refill prediction logic, matching the spec's example:
  Quantity: 60 tablets, Dosage: 2/day -> 60 / 2 = 30 days until empty.

Written as pure functions (no Django/DB imports) so they're trivially
unit-testable and reusable from a management command, a Celery task,
or an API view without change.
"""

from datetime import date, timedelta

from django.utils import timezone


def days_of_stock_remaining(quantity_on_hand: float, daily_consumption: float) -> float | None:
    """
    How many days of medicine remain, given current stock and how many
    units are consumed per day. Returns None if daily_consumption is 0
    (division by zero -> "can't estimate", not a crash).
    """
    if daily_consumption <= 0:
        return None
    return quantity_on_hand / daily_consumption


def estimated_depletion_date(
    quantity_on_hand: float,
    daily_consumption: float,
    as_of: date | None = None,
) -> date | None:
    """The calendar date the medicine is expected to run out."""
    days_left = days_of_stock_remaining(quantity_on_hand, daily_consumption)
    if days_left is None:
        return None
    reference = as_of or timezone.localdate()
    return reference + timedelta(days=days_left)


def recommended_refill_date(
    quantity_on_hand: float,
    daily_consumption: float,
    lead_time_days: int = 5,
    as_of: date | None = None,
) -> date | None:
    """
    The date to actually order/collect a refill by, allowing lead_time_days
    of buffer before the medicine is projected to run out completely.
    """
    depletion = estimated_depletion_date(quantity_on_hand, daily_consumption, as_of)
    if depletion is None:
        return None
    return depletion - timedelta(days=lead_time_days)


def is_low_stock(
    quantity_on_hand: float,
    daily_consumption: float,
    threshold_days: int = 5,
) -> bool:
    """True once remaining stock will run out within threshold_days."""
    days_left = days_of_stock_remaining(quantity_on_hand, daily_consumption)
    if days_left is None:
        return False
    return days_left <= threshold_days


def refill_notification_message(medicine_name: str, days_left: float) -> str:
    """Matches the spec's example wording: 'Your BP medicine is expected
    to finish in 5 days. Please arrange a refill.'"""
    rounded = round(days_left)
    return f"Your {medicine_name} is expected to finish in {rounded} days. Please arrange a refill."
