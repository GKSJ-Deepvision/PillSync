"""Measure how good the consumption forecast actually is.

The specification's performance metrics include "refill prediction accuracy". A
refill date is only as good as the daily consumption rate behind it, so that is
what this checks - by replaying history. For each medicine with enough doses:
stand at a past cutoff, forecast the next week's consumption using only what was
known then, and compare with what the patient really took.

This is a *forecast* accuracy, measured on real dose events. It says nothing
about the tail case of running out on a particular date, which needs months of
refill cycles that a young platform does not have yet.

Reads the history for every medicine in one query and does the arithmetic in
memory. An earlier version queried per medicine and per cutoff - about 1,400
queries for 200 medicines, which made the administrator dashboard take five
seconds.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.db.models import Min
from django.utils import timezone

from apps.common.choices import DoseStatus
from apps.refills import engine
from apps.refills.services.prediction import WINDOW_DAYS, scheduled_daily
from apps.reminders.models import DoseEvent

HORIZON_DAYS = 7
#: A medicine needs this many days of resolved history before it can be scored:
#: a two-week window to forecast from, plus the week being predicted.
MIN_HISTORY_DAYS = WINDOW_DAYS + HORIZON_DAYS
TOLERANCE = 0.20

# (day, taken?, units)
Event = tuple[date, bool, Decimal]


def forecast_at(events: list[Event], scheduled: Decimal, cutoff: date) -> Decimal | None:
    """The daily rate a predictor standing at `cutoff` would have used."""
    window = [e for e in events if cutoff - timedelta(days=WINDOW_DAYS) <= e[0] < cutoff]
    if not window:
        return None
    first = min(e[0] for e in window)
    units = sum((e[2] for e in window if e[1]), Decimal(0))
    days = max(1, min(WINDOW_DAYS, (cutoff - first).days))
    return engine.blend_consumption(scheduled, units, days, len(window)).average_daily


def actual_between(events: list[Event], start: date, end: date) -> Decimal:
    return sum((e[2] for e in events if e[1] and start <= e[0] < end), Decimal(0))


def _load(medicine_ids, today: date, cutoffs: int):
    """Everything the backtest needs, in two queries."""
    earliest = today - timedelta(days=HORIZON_DAYS * cutoffs + WINDOW_DAYS + 1)
    tz_start = timezone.make_aware(datetime.combine(earliest, time.min))
    resolved = [DoseStatus.TAKEN, DoseStatus.MISSED]

    first_seen = dict(
        DoseEvent.objects.filter(medicine_id__in=medicine_ids, status__in=resolved)
        .values_list("medicine_id")
        .annotate(first=Min("scheduled_for"))
    )
    events: dict = defaultdict(list)
    rows = DoseEvent.objects.filter(
        medicine_id__in=medicine_ids, status__in=resolved, scheduled_for__gte=tz_start
    ).values_list("medicine_id", "scheduled_for", "status", "quantity_taken")
    for medicine_id, when, status, quantity in rows:
        taken = status == DoseStatus.TAKEN
        events[medicine_id].append(
            (
                timezone.localtime(when).date(),
                taken,
                Decimal(quantity or 0) if taken else Decimal(0),
            )
        )
    return first_seen, events


def consumption_backtest(medicines, today: date, *, cutoffs: int = 3) -> dict:
    """Score the forecast over a set of medicines.

    `cutoffs` past weeks are used per medicine, so one lucky or unlucky week does
    not decide the result.
    """
    medicines = list(medicines)
    first_seen, events = _load([m.pk for m in medicines], today, cutoffs)

    samples: list[float] = []
    scored = 0
    for medicine in medicines:
        first = first_seen.get(medicine.pk)
        if first is None or (today - timezone.localtime(first).date()).days < MIN_HISTORY_DAYS:
            continue

        scheduled = scheduled_daily(medicine)
        errors = []
        for step in range(cutoffs):
            cutoff = today - timedelta(days=HORIZON_DAYS * (step + 1))
            forecast = forecast_at(events[medicine.pk], scheduled, cutoff)
            if forecast is None:
                continue
            actual = actual_between(
                events[medicine.pk], cutoff, cutoff + timedelta(days=HORIZON_DAYS)
            )
            predicted = forecast * HORIZON_DAYS
            errors.append(float(abs(predicted - actual) / max(actual, Decimal(1))))
        if errors:
            scored += 1
            samples.extend(errors)

    if not samples:
        return {
            "medicines_scored": 0,
            "samples": 0,
            "mean_absolute_percentage_error": None,
            "accuracy_percent": None,
            "within_tolerance_percent": None,
            "tolerance_percent": int(TOLERANCE * 100),
            "horizon_days": HORIZON_DAYS,
            "note": f"Needs {MIN_HISTORY_DAYS}+ days of dose history per medicine.",
        }

    mape = sum(samples) / len(samples)
    within = sum(1 for e in samples if e <= TOLERANCE) / len(samples)
    return {
        "medicines_scored": scored,
        "samples": len(samples),
        "mean_absolute_percentage_error": round(mape * 100, 1),
        "accuracy_percent": round(max(0.0, 1 - mape) * 100, 1),
        "within_tolerance_percent": round(within * 100, 1),
        "tolerance_percent": int(TOLERANCE * 100),
        "horizon_days": HORIZON_DAYS,
        "note": "",
    }
