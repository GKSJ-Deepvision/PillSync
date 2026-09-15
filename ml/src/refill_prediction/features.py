"""Feature engineering for the refill-prediction ML model.

The same functions are used at **training time** (on synthetic / historical
data, see ``synthetic_data.py``) and at **inference time** (``model.py``),
so the feature vector the model was trained on is guaranteed to match the
one it is served with.

Everything here operates on plain dicts/lists that mirror the Supabase
tables (``medications``, ``medication_schedules``, ``dose_logs`` — see
``docs/database/schema_m2_m3.sql``), so the FastAPI layer can pass the JSON
payload it receives straight through without any ORM in between.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from statistics import pstdev
from typing import Any
from collections.abc import Iterable

FEATURE_NAMES = [
    "prescribed_daily_dose",
    "stock_quantity",
    "low_stock_threshold",
    "refill_lead_days",
    "n_schedules",
    "form_code",
    "therapeutic_class_code",
    "log_count",
    "adherence_rate_7d",
    "adherence_rate_14d",
    "adherence_rate_30d",
    "adherence_trend",
    "weekday_weekend_gap",
    "missed_streak",
    "adherence_volatility",
]

# Small, fixed vocabularies so the encoding is stable between train/serve.
FORM_VOCAB = [
    "tablet", "capsule", "syrup", "injection", "drops", "inhaler", "cream", "patch", "other",
]
THERAPEUTIC_CLASS_VOCAB = [
    "antibiotic", "antihistamine", "bronchodilator", "cardiac", "antidiabetic",
    "thyroid", "vitamin", "analgesic", "gastro", "other",
]


def _encode(value: str | None, vocab: list[str]) -> int:
    if not value:
        return len(vocab) - 1  # "other"/unknown bucket
    value = value.lower().strip()
    return vocab.index(value) if value in vocab else len(vocab) - 1


def daily_dose_from_schedules(schedules: Iterable[dict[str, Any]]) -> float:
    """Prescribed average units/day, honouring partial-week schedules."""
    schedules = [s for s in schedules if s.get("is_active", True)]
    if not schedules:
        return 0.0
    weekly_total = 0.0
    for s in schedules:
        days = s.get("days_of_week") or list(range(7))
        weekly_total += float(s.get("dose_quantity", 0)) * len(days)
    return weekly_total / 7.0


def _parse_ts(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    text = str(value).replace("Z", "+00:00")
    return datetime.fromisoformat(text)


def _resolved(logs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [log_entry for log_entry in logs if log_entry.get("status") in ("taken", "missed")]


def _adherence_rate(logs: list[dict[str, Any]], now: datetime, days: int) -> float | None:
    cutoff = now - timedelta(days=days)
    window = [log_entry for log_entry in _resolved(logs) if _parse_ts(log_entry["scheduled_for"]) >= cutoff]
    if not window:
        return None
    taken = sum(1 for log_entry in window if log_entry["status"] == "taken")
    return taken / len(window)


def _missed_streak(logs: list[dict[str, Any]], now: datetime) -> int:
    """Consecutive missed doses counting back from the most recent resolved log."""
    ordered = sorted(
        _resolved(logs), key=lambda log_entry: _parse_ts(log_entry["scheduled_for"]), reverse=True
    )
    streak = 0
    for log in ordered:
        if log["status"] == "missed":
            streak += 1
        else:
            break
    return streak


def _weekday_weekend_gap(logs: list[dict[str, Any]]) -> float:
    """Positive => worse adherence on weekends than weekdays."""
    weekday, weekend = [], []
    for log in _resolved(logs):
        ts = _parse_ts(log["scheduled_for"])
        bucket = weekend if ts.weekday() >= 5 else weekday
        bucket.append(1 if log["status"] == "taken" else 0)
    if not weekday or not weekend:
        return 0.0
    return (sum(weekday) / len(weekday)) - (sum(weekend) / len(weekend))


def _daily_adherence_series(logs: list[dict[str, Any]], now: datetime, days: int) -> list[float]:
    cutoff = now - timedelta(days=days)
    by_day: dict[date, list[int]] = {}
    for log in _resolved(logs):
        ts = _parse_ts(log["scheduled_for"])
        if ts < cutoff:
            continue
        by_day.setdefault(ts.date(), []).append(1 if log["status"] == "taken" else 0)
    return [sum(v) / len(v) for v in by_day.values() if v]


@dataclass
class FeatureBundle:
    values: list[float]
    prescribed_daily_dose: float
    log_count: int
    names: list[str] = field(default_factory=lambda: list(FEATURE_NAMES))

    def as_dict(self) -> dict[str, float]:
        return dict(zip(self.names, self.values, strict=False))


def build_features(
    medication: dict[str, Any],
    schedules: list[dict[str, Any]],
    dose_logs: list[dict[str, Any]] | None,
    today: date | None = None,
) -> FeatureBundle:
    """Build the model's feature vector for one medication.

    ``dose_logs`` should be the trailing history available *as of* ``today``
    (in production: the last ~45 days from the ``dose_logs`` table). Passing
    an empty list is fine — the model degrades gracefully to prescription-only
    features and the caller should treat ``log_count == 0`` as "low
    confidence, prescribed dose used as-is".
    """
    dose_logs = dose_logs or []
    now = datetime.combine(today or date.today(), datetime.min.time())

    prescribed = daily_dose_from_schedules(schedules)
    active_schedules = [s for s in schedules if s.get("is_active", True)]

    a7 = _adherence_rate(dose_logs, now, 7)
    a14 = _adherence_rate(dose_logs, now, 14)
    a30 = _adherence_rate(dose_logs, now, 30)
    # Fall back progressively so a brand-new medication still yields a sane
    # (fully-adherent) starting point rather than nulls poisoning the model.
    a30_f = a30 if a30 is not None else 1.0
    a14_f = a14 if a14 is not None else a30_f
    a7_f = a7 if a7 is not None else a14_f

    trend = a7_f - a30_f
    series = _daily_adherence_series(dose_logs, now, 30)
    volatility = pstdev(series) if len(series) > 1 else 0.0

    values = [
        prescribed,
        float(medication.get("stock_quantity", 0) or 0),
        float(medication.get("low_stock_threshold", 5) or 5),
        float(medication.get("refill_lead_days", 5) or 5),
        float(len(active_schedules)),
        float(_encode(medication.get("form"), FORM_VOCAB)),
        float(_encode(medication.get("therapeutic_class"), THERAPEUTIC_CLASS_VOCAB)),
        float(len(_resolved(dose_logs))),
        a7_f,
        a14_f,
        a30_f,
        trend,
        _weekday_weekend_gap(dose_logs),
        float(_missed_streak(dose_logs, now)),
        volatility,
    ]
    return FeatureBundle(values=values, prescribed_daily_dose=prescribed, log_count=len(_resolved(dose_logs)))
