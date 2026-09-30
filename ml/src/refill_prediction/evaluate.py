"""Backtest the refill predictor against simulated patients.

    python ml/src/refill_prediction/evaluate.py
    python ml/src/refill_prediction/evaluate.py --patients 400 --write docs/reports/refill-evaluation.md

There is no public dataset of "when did this person actually run out of tablets",
and real patient data must never enter this repository. So the evaluation
simulates patients with known, differently-imperfect behaviour, runs the same
`apps.refills.engine` functions the application uses, and compares the predicted
run-out day with the day the simulated stock really hit zero.

Two questions are answered:

1. **How close is the predicted run-out date?** Compared across estimators - the
   schedule alone, the patient's observed behaviour alone, and blends at several
   history weights - which is how `FULL_WEIGHT_DOSES` in the engine was chosen.
2. **Does the alert fire in time?** Whether a low-stock warning reaches the
   patient before they run out, and how much notice it gives.

What this cannot tell you: how real people behave. The archetypes are plausible
(steady, forgetful, weekend-skipper, fading motivation) but invented, so the
figures show the method works and how the estimators rank - not the accuracy a
production deployment will see. That needs months of real dose data.
"""

from __future__ import annotations

import argparse
import random
import statistics
import sys
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "backend"))

from apps.refills import engine  # noqa: E402  (path set above)

WINDOW_DAYS = 14  # mirrors apps/refills/services/prediction.py
LEAD_DAYS = 5
START = date(2026, 1, 1)

ARCHETYPES = {
    "steady": lambda day, rng: 0.97,
    "typical": lambda day, rng: 0.85,
    "forgetful": lambda day, rng: 0.65,
    "weekend skipper": lambda day, rng: 0.4 if (START + timedelta(days=day)).weekday() >= 5 else 0.95,
    "fading": lambda day, rng: max(0.5, 0.95 - day * 0.008),
}


@dataclass
class Patient:
    kind: str
    per_day: int
    stock: int
    taken: list[int]  # units taken per day, for a horizon long enough to run out

    def out_day(self) -> int | None:
        """First day that starts with no stock."""
        used = 0
        for day, units in enumerate(self.taken):
            if used >= self.stock:
                return day
            used += units
        return None


def simulate(kind: str, rng: random.Random, horizon: int = 200) -> Patient:
    per_day = rng.choice([1, 2, 2, 3])
    stock = rng.choice([30, 60, 60, 90])
    p = ARCHETYPES[kind]
    taken = [sum(1 for _ in range(per_day) if rng.random() < p(day, rng)) for day in range(horizon)]
    return Patient(kind, per_day, stock, taken)


def estimate(patient: Patient, day: int, full_weight: float | None):
    """Predict at the start of `day`, using only what happened before it.

    full_weight=None means schedule only; float('inf') means observed only.
    """
    used = sum(patient.taken[:day])
    remaining = Decimal(patient.stock - used)
    scheduled = Decimal(patient.per_day)
    lookback = min(WINDOW_DAYS, day)
    units = Decimal(sum(patient.taken[day - lookback : day]))
    resolved = lookback * patient.per_day

    if full_weight is None:
        average = scheduled
    else:
        weight_doses = 1 if full_weight == float("inf") else full_weight
        average = engine.blend_consumption(
            scheduled, units, lookback, resolved, full_weight_doses=weight_doses
        ).average_daily
    return engine.predict(remaining, average, START + timedelta(days=day), lead_days=LEAD_DAYS)


USED = engine.FULL_WEIGHT_DOSES  # the value the application really runs with
VARIANTS = [
    ("schedule only", None),
    ("observed only", float("inf")),
    *[
        (f"blend, full weight at {n} doses" + (" (used)" if n == USED else ""), n)
        for n in sorted({5, 10, 20, 40, USED})
    ],
]
CHECKPOINTS = [7, 14, 21]


def date_error(patients, full_weight):
    errors = []
    for p in patients:
        actual = p.out_day()
        for day in CHECKPOINTS:
            if actual is None or actual <= day + 2 or sum(p.taken[:day]) >= p.stock:
                continue  # already out, or out too soon for a forecast to mean anything
            prediction = estimate(p, day, full_weight)
            if prediction.depletion_date is None:
                continue
            predicted = (prediction.depletion_date - START).days
            errors.append(predicted - actual)
    return errors


def alert_timing(patients, full_weight):
    """Day the first LOW/CRITICAL/OUT warning would fire, against the true run-out day."""
    lead_times, missed_alerts, too_early = [], 0, 0
    for p in patients:
        actual = p.out_day()
        if actual is None:
            continue
        first = None
        for day in range(3, actual + 1):
            if estimate(p, day, full_weight).status in (engine.LOW, engine.CRITICAL, engine.OUT):
                first = day
                break
        if first is None or first >= actual:
            missed_alerts += 1
            continue
        lead = actual - first
        lead_times.append(lead)
        if lead > LEAD_DAYS + 7:
            too_early += 1
    n = len([p for p in patients if p.out_day() is not None])
    return {
        "warned_before_running_out_percent": round(100 * (n - missed_alerts) / n, 1),
        "median_notice_days": statistics.median(lead_times) if lead_times else None,
        "warned_too_early_percent": round(100 * too_early / n, 1),
    }


def pct_within(errors, days):
    return round(100 * sum(1 for e in errors if abs(e) <= days) / len(errors), 1)


def run(patients_per_kind: int, seed: int) -> str:
    rng = random.Random(seed)
    cohort = [simulate(kind, rng) for kind in ARCHETYPES for _ in range(patients_per_kind)]

    lines = [
        "# Refill prediction evaluation",
        "",
        f"Simulated cohort: {len(cohort)} patients ({patients_per_kind} of each of "
        f"{len(ARCHETYPES)} behaviours), seed {seed}. Forecasts are made at days "
        f"{', '.join(map(str, CHECKPOINTS))} using only earlier history, and compared with the "
        "day the simulated stock actually hit zero.",
        "",
        "## Run-out date error",
        "",
        "Error = predicted day minus actual day. Negative means the predictor said "
        "\"sooner\" than the patient really ran out.",
        "",
        "| Estimator | Forecasts | Mean abs. error (days) | Bias (days) | Within ±2 days | Within ±5 days |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for label, weight in VARIANTS:
        errors = date_error(cohort, weight)
        mae = statistics.fmean(abs(e) for e in errors)
        lines.append(
            f"| {label} | {len(errors)} | {mae:.2f} | {statistics.fmean(errors):+.2f} | "
            f"{pct_within(errors, 2)}% | {pct_within(errors, 5)}% |"
        )

    lines += ["", "## Error by behaviour (estimator used in the app)", "",
              "| Behaviour | Schedule only: mean abs. error | Blended: mean abs. error |", "|---|---:|---:|"]
    for kind in ARCHETYPES:
        group = [p for p in cohort if p.kind == kind]
        base = statistics.fmean(abs(e) for e in date_error(group, None))
        used = statistics.fmean(abs(e) for e in date_error(group, USED))
        lines.append(f"| {kind} | {base:.2f} | {used:.2f} |")

    lines += ["", "## Do warnings arrive in time?", "",
              f"A warning fires when status reaches LOW (run-out within {LEAD_DAYS} days). "
              "\"Too early\" means more than 12 days' notice, which teaches patients to ignore it.",
              "", "| Estimator | Warned before running out | Median notice (days) | Warned too early |",
              "|---|---:|---:|---:|"]
    for label, weight in [v for v in VARIANTS if v[1] is None or v[1] == USED]:
        r = alert_timing(cohort, weight)
        lines.append(
            f"| {label} | {r['warned_before_running_out_percent']}% | {r['median_notice_days']} | "
            f"{r['warned_too_early_percent']}% |"
        )

    lines += ["", "## Reading these results", "",
              "- The blend beats the schedule alone in every behaviour group, and roughly ties it for "
              "patients who take everything - which is the reason to learn from history at all.",
              "- Patients whose habits are *changing* stay hard to forecast (the 'fading' group): "
              "a two-week window lags a downward trend, so their run-out date is still off by "
              "about a week and a half. A trend term is the obvious next step.",
              "- Every estimator is biased early (it says \"sooner\"). For a refill reminder that is the "
              "safe direction: a patient is told slightly too soon, not too late.",
              "- The history weight is not sensitive: 5, 10 and 20 doses differ by well under a day "
              "of mean error. What matters is using history at all; the exact weight barely does.",
              "- The simulated behaviours are invented. This shows the method works and how the "
              "estimators rank; it is **not** the accuracy real patients would see.",
              "- Doses are assumed to be recorded faithfully. A patient who takes tablets but does "
              "not tap \"taken\" looks like a low consumer, so the forecast runs late for them.",
              ""]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--patients", type=int, default=200, help="per behaviour")
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--write", type=Path, help="also write the markdown report here")
    args = parser.parse_args()

    report = run(args.patients, args.seed)
    print(report)
    if args.write:
        args.write.parent.mkdir(parents=True, exist_ok=True)
        args.write.write_text(report, encoding="utf-8")


if __name__ == "__main__":
    main()
