"""The refill prediction maths. Pure functions, no Django, no database.

Kept free of the ORM so it can be tested against the specification's own worked
example (60 tablets at 2 a day is 30 days) and evaluated offline by the ML
workbench against simulated patients, without standing up a database.

The specification names the inputs: initial quantity, daily dosage frequency,
quantity per dose, missed-dose history and manual stock updates. The first, third
and fifth are folded into `remaining` (what is actually in the patient's hand
right now, which already reflects every dose taken and every manual correction).
That leaves the interesting question - *how fast will it be used?* - which is
`blend_consumption`.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal

# Statuses, worst last, so `STATUS_LEVEL` can order them for alerting.
OK, COVERED, UNKNOWN, LOW, CRITICAL, OUT = "OK", "COVERED", "UNKNOWN", "LOW", "CRITICAL", "OUT"
STATUS_LEVEL = {OK: 0, COVERED: 0, UNKNOWN: 0, LOW: 1, CRITICAL: 2, OUT: 3}

# Fewer than this many days of resolved doses and the observed rate is noise:
# one missed dose in two days would read as "takes 50% of the medicine".
MIN_OBSERVED_DAYS = 3
# Absorbs Decimal rounding in a quotient before it is floored (see `predict`).
EPSILON = Decimal("0.000001")
# Resolved doses at which the observed rate is trusted fully. Below it, the
# scheduled rate carries the remaining weight. Chosen from the backtest in
# ml/src/refill_prediction/evaluate.py, not by feel.
FULL_WEIGHT_DOSES = 10


@dataclass(frozen=True)
class Consumption:
    scheduled_daily: Decimal
    observed_daily: Decimal | None
    average_daily: Decimal
    sample_days: int
    resolved_doses: int
    observed_weight: float


@dataclass(frozen=True)
class Prediction:
    status: str
    remaining: Decimal
    average_daily: Decimal
    days_remaining: Decimal | None
    depletion_date: date | None
    recommended_refill_date: date | None
    covers_course: bool


def blend_consumption(
    scheduled_daily: Decimal,
    observed_units: Decimal,
    observed_days: int,
    resolved_doses: int,
    *,
    full_weight_doses: int = FULL_WEIGHT_DOSES,
) -> Consumption:
    """Estimate units used per day.

    Two estimates exist and each fails differently. The *scheduled* rate assumes
    the patient takes everything as prescribed: right on day one, wrong for
    anyone who misses doses, so it predicts running out too soon. The *observed*
    rate is what they actually took: accurate once there is history, but wildly
    noisy in the first days and blind to a schedule that has just changed.

    So the two are blended, weighted by how much history there is. With none, the
    answer is the schedule; with plenty, it is the patient's real behaviour.
    """
    scheduled = Decimal(scheduled_daily)
    if observed_days < MIN_OBSERVED_DAYS or scheduled <= 0:
        return Consumption(scheduled, None, scheduled, observed_days, resolved_doses, 0.0)

    observed = Decimal(observed_units) / Decimal(observed_days)
    weight = min(1.0, resolved_doses / full_weight_doses)
    average = Decimal(str(weight)) * observed + Decimal(str(1 - weight)) * scheduled
    return Consumption(scheduled, observed, average, observed_days, resolved_doses, weight)


def predict(
    remaining: Decimal,
    average_daily: Decimal,
    today: date,
    *,
    lead_days: int = 5,
    course_end: date | None = None,
) -> Prediction:
    """When will the stock run out, and when should the patient refill?

    The specification's worked example: 60 tablets at 2 a day is
    60 / 2 = 30 days.
    """
    remaining = Decimal(remaining)
    average_daily = Decimal(average_daily)

    if remaining <= 0:
        return Prediction(OUT, remaining, average_daily, Decimal(0), today, today, False)
    if average_daily <= 0:
        # Stock but no schedule: nothing consumes it, so nothing to predict.
        return Prediction(UNKNOWN, remaining, average_daily, None, None, None, False)

    days_remaining = remaining / average_daily
    # The first day the patient would not have a full day's supply. Doses on
    # days 0..29 use 60 tablets at 2 a day, so day 30 is the first short one.
    #
    # The epsilon matters for fractional rates. 1/7 is not exact in Decimal, so
    # 4 tablets once a week comes out as 27.999999... and a bare floor() would
    # report 27 days instead of 28 - an off-by-one for every weekly or
    # alternate-day medicine.
    depletion = today + timedelta(days=math.floor(days_remaining + EPSILON))

    if course_end is not None and depletion > course_end:
        # A 7-day antibiotic with 14 tablets never runs out; warning that it will
        # a day before the course ends would send the patient to a pharmacy for
        # a medicine they have finished.
        return Prediction(COVERED, remaining, average_daily, days_remaining, depletion, None, True)

    refill_by = max(today, depletion - timedelta(days=lead_days))
    whole_days = (depletion - today).days
    critical_days = max(1, lead_days // 2)

    if whole_days <= critical_days:
        status = CRITICAL
    elif whole_days <= lead_days:
        status = LOW
    else:
        status = OK
    return Prediction(status, remaining, average_daily, days_remaining, depletion, refill_by, False)


def project(
    remaining: Decimal, average_daily: Decimal, today: date, days: int = 30
) -> list[tuple[date, Decimal]]:
    """Projected stock, one point a day, floored at zero. Feeds the stock chart."""
    points = []
    left = Decimal(remaining)
    for offset in range(days + 1):
        points.append((today + timedelta(days=offset), max(left, Decimal(0))))
        left -= Decimal(average_daily)
    return points
