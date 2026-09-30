"""Compute and store refill predictions from real dose history."""

from __future__ import annotations

import logging
from datetime import date, timedelta
from decimal import Decimal

from django.conf import settings
from django.db.models import Count, Min, Q, Sum
from django.utils import timezone

from apps.common.choices import DoseStatus
from apps.refills import engine
from apps.refills.models import RefillPrediction
from apps.reminders.models import DoseEvent

logger = logging.getLogger(__name__)

#: How far back observed consumption looks. Two weeks smooths out a bad day
#: without letting a change of routine linger for a month.
WINDOW_DAYS = 14


def scheduled_daily(medicine) -> Decimal:
    """Units per day if every active schedule is followed exactly."""
    return sum(
        (s.doses_per_day() for s in medicine.schedules.all() if s.is_active),
        Decimal("0"),
    )


def observed_consumption(
    medicine, today: date, window_days: int = WINDOW_DAYS
) -> tuple[Decimal, int, int]:
    """(units taken, days covered, doses resolved) over the recent window.

    Only complete days count - today is still in progress, and counting its
    morning dose against a full day's denominator would understate consumption.
    Skipped doses are left out: they were deliberately not taken, and treating
    them as "used" or "missed" would each be wrong.
    """
    start = today - timedelta(days=window_days)
    stats = DoseEvent.objects.filter(
        medicine=medicine,
        scheduled_for__date__gte=start,
        scheduled_for__date__lt=today,
        status__in=[DoseStatus.TAKEN, DoseStatus.MISSED],
    ).aggregate(
        units=Sum("quantity_taken", filter=Q(status=DoseStatus.TAKEN)),
        resolved=Count("id"),
        first=Min("scheduled_for"),
    )
    if not stats["resolved"]:
        return Decimal("0"), 0, 0

    first_day = timezone.localtime(stats["first"]).date()
    days = max(1, min(window_days, (today - first_day).days))
    return Decimal(stats["units"] or 0), days, stats["resolved"]


def compute(medicine, today: date | None = None) -> tuple[engine.Prediction, engine.Consumption]:
    today = today or timezone.localdate()
    units, days, resolved = observed_consumption(medicine, today)
    consumption = engine.blend_consumption(scheduled_daily(medicine), units, days, resolved)
    prediction = engine.predict(
        medicine.quantity_remaining,
        consumption.average_daily,
        today,
        lead_days=getattr(settings, "REFILL_LEAD_TIME_DAYS", 5),
        course_end=medicine.end_date,
    )
    return prediction, consumption


def _confidence(prediction: engine.Prediction, consumption: engine.Consumption) -> float:
    if prediction.status == engine.OUT:
        return 1.0  # no stock is a fact, not a forecast
    if prediction.status == engine.UNKNOWN:
        return 0.0
    return round(0.5 + 0.5 * consumption.observed_weight, 2)


def recompute(medicine, today: date | None = None) -> RefillPrediction | None:
    """Recalculate and store the prediction for one medicine.

    A stopped medicine has no prediction: keeping one would go on warning a
    patient about a medicine they no longer take.
    """
    if not medicine.is_active:
        RefillPrediction.objects.filter(medicine=medicine).delete()
        return None

    prediction, consumption = compute(medicine, today)
    obj, _created = RefillPrediction.objects.get_or_create(
        medicine=medicine,
        defaults={
            "patient_id": medicine.patient_id,
            "computed_at": timezone.now(),
            "status": prediction.status,
            "remaining_stock": prediction.remaining,
        },
    )
    obj.patient_id = medicine.patient_id
    obj.computed_at = timezone.now()
    obj.status = prediction.status
    obj.remaining_stock = max(prediction.remaining, Decimal("0"))
    obj.scheduled_daily = consumption.scheduled_daily
    obj.observed_daily = consumption.observed_daily
    obj.average_daily = consumption.average_daily
    obj.observed_weight = consumption.observed_weight
    obj.sample_days = consumption.sample_days
    obj.resolved_doses = consumption.resolved_doses
    obj.days_remaining = (
        prediction.days_remaining.quantize(Decimal("0.01"))
        if prediction.days_remaining is not None
        else None
    )
    obj.depletion_date = prediction.depletion_date
    obj.recommended_refill_date = prediction.recommended_refill_date
    obj.covers_course = prediction.covers_course
    obj.confidence = _confidence(prediction, consumption)

    # Stock recovered (a refill, a correction): forget the old alert level so
    # the next time it runs low the patient is told again.
    obj.alert_level = min(obj.alert_level, engine.STATUS_LEVEL[prediction.status])
    obj.save()
    return obj


def recompute_all(*, patient_ids=None) -> int:
    """Recompute every active medicine's prediction. Returns how many."""
    from apps.medications.models import Medicine

    medicines = Medicine.objects.filter(is_active=True).prefetch_related("schedules")
    if patient_ids is not None:
        medicines = medicines.filter(patient_id__in=patient_ids)
    count = 0
    for medicine in medicines:
        recompute(medicine)
        count += 1
    return count


def projection(prediction: RefillPrediction, days: int = 30) -> list[dict]:
    today = timezone.localdate()
    return [
        {"date": day, "remaining": float(left)}
        for day, left in engine.project(
            prediction.remaining_stock, prediction.average_daily, today, days
        )
    ]


def message_for(medicine, prediction: RefillPrediction) -> str:
    """The notification text. The LOW case is the specification's own example."""
    name = medicine.display_name
    if prediction.status == engine.OUT:
        return f"You have run out of {name}. Please arrange a refill."
    days = (
        (prediction.depletion_date - timezone.localdate()).days
        if prediction.depletion_date
        else None
    )
    if days is None:
        return f"{name} has no dose times set, so its stock cannot be predicted."
    plural = "day" if days == 1 else "days"
    if prediction.status == engine.CRITICAL:
        return f"Your {name} will run out in {days} {plural}. Arrange a refill today."
    if prediction.status == engine.LOW:
        return f"Your {name} is expected to finish in {days} {plural}. Please arrange a refill."
    if prediction.status == engine.COVERED:
        return f"You have enough {name} for the rest of this course."
    return f"Your {name} should last about {days} days."
