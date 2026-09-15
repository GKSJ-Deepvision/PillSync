"""Synthetic training-data generator for the refill-prediction model.

PillSync is a new product — there is no production history of real
``dose_logs`` yet to train on. Rather than ship a rule-based formula dressed
up as "AI", this module simulates a realistic population of
patient-medication adherence patterns, generates dose-taking histories from
those hidden patterns, and derives (features, label) pairs the exact same
way ``features.py`` would from real Supabase data.

Once the app has been live for a few months, swap this module out for
``build_training_frame_from_dose_logs`` (see bottom of file) — same feature
pipeline, real labels, zero other code changes.

Design of the simulation
-------------------------
Each simulated "case" is one medication for one patient over a 60-day
window:

1. A hidden **base adherence probability** ``p0`` is drawn per case from a
   Beta distribution — most people cluster high (good adherence), with a
   realistic long tail of erratic/poor adherence.
2. A hidden **trend** (improving, stable, or declining) drifts ``p0``
   linearly across the window — e.g. adherence commonly erodes over a long
   refill cycle, or improves after a caregiver starts nudging the patient.
3. A **weekend effect** lowers weekday-vs-weekend probability for a subset
   of cases (routines slip on weekends).
4. Each scheduled dose is then a Bernoulli draw from the day's effective
   probability, which is what actually populates ``dose_logs``.
5. Real drug metadata (dosage form, therapeutic class, pack size) is
   resampled from ``indian_pharmaceutical_products_clean.csv`` so the
   categorical features and stock magnitudes the model sees look like real
   PillSync inventory, and therapeutic class is given a mild, deliberate
   influence on ``p0`` (chronic-disease classes skew slightly more adherent
   than short-course ones) — a signal the model has to actually learn from
   the categorical feature rather than from stock numbers alone.

The first ``history_days`` of each window are used to compute features
(exactly what would be available in production); the remaining
``future_days`` are used only to compute the label (the true future
adherence rate) — a straightforward, leak-free train/label split.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from .features import FEATURE_NAMES, build_features

HISTORY_DAYS = 42
FUTURE_DAYS = 14

# Mild, deliberate ground-truth signal: chronic/long-term therapy classes
# trend toward higher sustained adherence than short-course / symptomatic
# ones. Anything not listed gets 0.0 (neutral).
CLASS_ADHERENCE_OFFSET = {
    "cardiac": 0.06,
    "antidiabetic": 0.05,
    "thyroid": 0.05,
    "antihistamine": -0.02,
    "antibiotic": -0.05,
    "analgesic": -0.06,
}

RAW_CSV_CANDIDATES = [
    Path(__file__).resolve().parents[3] / "data" / "raw" / "indian_pharmaceutical_products_clean.csv",
]


def _load_drug_catalog(sample_size: int = 20_000) -> pd.DataFrame:
    for path in RAW_CSV_CANDIDATES:
        if path.exists():
            df = pd.read_csv(
                path,
                usecols=["dosage_form", "pack_size", "therapeutic_class"],
                nrows=sample_size,
            )
            df = df.dropna(subset=["dosage_form"])
            df["therapeutic_class"] = df["therapeutic_class"].fillna("other").str.lower()
            df["dosage_form"] = df["dosage_form"].str.lower()
            df["pack_size"] = pd.to_numeric(df["pack_size"], errors="coerce").fillna(10)
            return df
    # Fallback so the pipeline still runs if the CSV isn't present.
    return pd.DataFrame(
        {
            "dosage_form": ["tablet"] * 10,
            "pack_size": [10] * 10,
            "therapeutic_class": ["other"] * 10,
        }
    )


@dataclass
class SimulatedCase:
    features: list[float]
    label_future_adherence: float


def _simulate_case(rng: random.Random, np_rng: np.random.Generator, drug_row: pd.Series, start: date) -> SimulatedCase:
    # 1. Hidden persona.
    base = np_rng.beta(6, 2)  # skews high, long left tail
    therapeutic_class = drug_row["therapeutic_class"] if drug_row["therapeutic_class"] in CLASS_ADHERENCE_OFFSET or True else "other"
    base = float(np.clip(base + CLASS_ADHERENCE_OFFSET.get(therapeutic_class, 0.0), 0.05, 0.99))

    trend_direction = rng.choices([-1, 0, 1], weights=[0.25, 0.45, 0.30])[0]
    # Lower-baseline-adherence patients drift faster in either direction —
    # a genuine interaction between `base` and the trend, not a separate
    # additive term.
    trend_slope = trend_direction * rng.uniform(0.0015, 0.006) * (1.6 - base)
    weekend_penalty = rng.uniform(0.0, 0.25) if rng.random() < 0.5 else 0.0
    # A declining patient's weekends slip further than a stable patient's —
    # another interaction, not visible to a purely additive model.
    if trend_direction < 0:
        weekend_penalty *= 1.6
    day_noise_sd = rng.uniform(0.03, 0.12)
    momentum = rng.uniform(0.15, 0.45)  # how much yesterday's outcome carries over
    # A genuine conjunction, not visible to a model that only sees main
    # effects: patients who are BOTH declining AND weekend-inconsistent are
    # a distinct high-risk cluster, not just the sum of the two signals.
    if trend_direction < 0 and weekend_penalty > 0.12:
        base *= 0.82

    # 2. Schedule: 1-3 doses/day, most days of week (occasionally alternate-day).
    n_schedules = rng.choices([1, 2, 3], weights=[0.45, 0.4, 0.15])[0]
    schedules = []
    for _ in range(n_schedules):
        days_of_week = list(range(7)) if rng.random() < 0.85 else rng.sample(range(7), k=rng.choice([3, 4, 5]))
        schedules.append(
            {
                "dose_quantity": rng.choice([1, 1, 1, 2]),
                "days_of_week": days_of_week,
                "is_active": True,
            }
        )

    total_days = HISTORY_DAYS + FUTURE_DAYS
    dose_logs = []
    ewm_recent = base  # rolling memory of how the last few days actually went
    for day_offset in range(total_days):
        day = start + timedelta(days=day_offset)
        weekday = day.weekday()
        p_today = base + trend_slope * day_offset
        if weekday >= 5:
            p_today -= weekend_penalty
        p_today += np_rng.normal(0, day_noise_sd)
        # Adherence "spirals": once recent behaviour drops below ~0.5 it
        # drags the next day down further (missed doses tend to cluster in
        # real patients), a threshold/interaction effect a linear model
        # cannot represent but a tree ensemble can.
        if ewm_recent < 0.5:
            p_today -= (0.5 - ewm_recent) * momentum * 1.5
        p_today = momentum * ewm_recent + (1 - momentum) * p_today
        p_today = float(np.clip(p_today, 0.0, 1.0))

        day_outcomes = []
        for sched in schedules:
            if weekday not in sched["days_of_week"]:
                continue
            taken = np_rng.random() < p_today
            day_outcomes.append(1 if taken else 0)
            dose_logs.append(
                {
                    "scheduled_for": datetime.combine(day, datetime.min.time()).isoformat(),
                    "status": "taken" if taken else "missed",
                    "dose_quantity": sched["dose_quantity"],
                }
            )
        if day_outcomes:
            ewm_recent = 0.7 * ewm_recent + 0.3 * (sum(day_outcomes) / len(day_outcomes))

    history_cutoff = start + timedelta(days=HISTORY_DAYS)
    history_logs = [l for l in dose_logs if datetime.fromisoformat(l["scheduled_for"]) < datetime.combine(history_cutoff, datetime.min.time())]
    future_logs = [l for l in dose_logs if datetime.fromisoformat(l["scheduled_for"]) >= datetime.combine(history_cutoff, datetime.min.time())]

    if not future_logs:
        label = base
    else:
        label = sum(1 for l in future_logs if l["status"] == "taken") / len(future_logs)

    pack_size = max(6, int(drug_row["pack_size"] if pd.notna(drug_row["pack_size"]) else 10))
    # Stock is a random point within a plausible number of packs on hand.
    stock_quantity = pack_size * rng.uniform(0.3, 3.0)

    medication = {
        "stock_quantity": round(stock_quantity, 1),
        "low_stock_threshold": max(2, round(pack_size * 0.2)),
        "refill_lead_days": rng.choice([3, 5, 7]),
        "form": drug_row["dosage_form"],
        "therapeutic_class": therapeutic_class,
    }

    bundle = build_features(medication, schedules, history_logs, today=history_cutoff)
    return SimulatedCase(features=bundle.values, label_future_adherence=label)


def generate_training_frame(n_samples: int = 6000, seed: int = 42) -> pd.DataFrame:
    rng = random.Random(seed)
    np_rng = np.random.default_rng(seed)
    catalog = _load_drug_catalog()
    catalog_sample = catalog.sample(n=n_samples, replace=True, random_state=seed).reset_index(drop=True)

    anchor = date(2026, 1, 1)
    rows = []
    for i in range(n_samples):
        start = anchor - timedelta(days=rng.randint(0, 200))
        case = _simulate_case(rng, np_rng, catalog_sample.iloc[i], start)
        rows.append({**dict(zip(FEATURE_NAMES, case.features)), "label_future_adherence": case.label_future_adherence})

    return pd.DataFrame(rows)


def build_training_frame_from_dose_logs(medications: list[dict], schedules_by_med: dict, dose_logs_by_med: dict) -> pd.DataFrame:
    """Production path: build a training frame from *real* historical data.

    For every medication, compute features from dose_logs up to
    ``cutoff = today - FUTURE_DAYS`` and the label from the actual adherence
    rate observed in the following ``FUTURE_DAYS``. Call this once enough
    history has accumulated (a few months post-launch) and swap it in for
    ``generate_training_frame`` in ``train.py`` — no other code changes.
    """
    rows = []
    for med in medications:
        med_id = med["id"]
        logs = sorted(dose_logs_by_med.get(med_id, []), key=lambda l: l["scheduled_for"])
        if len(logs) < 10:
            continue
        last_ts = datetime.fromisoformat(str(logs[-1]["scheduled_for"]).replace("Z", "+00:00"))
        cutoff = last_ts.date() - timedelta(days=FUTURE_DAYS)
        history = [l for l in logs if datetime.fromisoformat(str(l["scheduled_for"]).replace("Z", "+00:00")).date() < cutoff]
        future = [l for l in logs if datetime.fromisoformat(str(l["scheduled_for"]).replace("Z", "+00:00")).date() >= cutoff]
        future_resolved = [l for l in future if l.get("status") in ("taken", "missed")]
        if not history or not future_resolved:
            continue
        label = sum(1 for l in future_resolved if l["status"] == "taken") / len(future_resolved)
        bundle = build_features(med, schedules_by_med.get(med_id, []), history, today=cutoff)
        rows.append({**bundle.as_dict(), "label_future_adherence": label})
    return pd.DataFrame(rows)
