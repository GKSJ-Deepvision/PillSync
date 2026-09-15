"""Inference-time refill predictor.

This is what the FastAPI service (``backend/apps/refills``) calls. It is a
**hybrid** of a deterministic calculation and a learned model, which is the
right split for this problem:

* The *prescribed* daily dose, days-of-week honouring, and the resulting
  calendar dates are exact arithmetic — there's nothing to "learn" there,
  and getting it slightly wrong would be worse than a lookup table.
* How much medicine a specific patient will *actually* take per day is a
  behavioural quantity with real uncertainty — that's the piece the
  RandomForest/GradientBoosting model (picked in ``train.py`` by
  cross-validated MAE against a linear baseline) is trained to estimate
  from the patient's own recent ``dose_logs``.

Multiplying the two gives an adjusted daily consumption rate that is
usually close to, but meaningfully different from, the naive
"stock / prescribed dose" formula precisely when it matters most: a
consistently under-adherent patient's stock will last longer than the
naive formula says, and a patient in a missed-dose spiral is flagged as an
*adherence risk* even before their stock count looks low.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import joblib

from .features import build_features, daily_dose_from_schedules

MODELS_DIR = Path(__file__).resolve().parents[2] / "models"
MODEL_PATH = MODELS_DIR / "refill_predictor.joblib"
METADATA_PATH = MODELS_DIR / "refill_predictor_metadata.json"

# Minimum resolved dose logs before we trust the model's adherence estimate
# over the simple "assume the patient takes it exactly as prescribed"
# baseline. Below this, predictions are still returned but flagged
# low-confidence and effectively fall back to the prescribed dose.
MIN_LOGS_FOR_CONFIDENCE = 14


@dataclass
class RefillPrediction:
    medication_id: str | None
    medication_name: str | None
    prescribed_daily_dose: float
    predicted_adherence_rate: float
    adjusted_daily_dose: float
    stock_quantity: float
    days_remaining: int | None
    depletion_date: str | None
    refill_by_date: str | None
    stock_status: str  # "no-schedule" | "empty" | "low" | "ok"
    adherence_risk: str  # "insufficient-data" | "stable" | "watch" | "declining"
    confidence: float
    model_version: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class RefillPredictor:
    """Loads the trained model once and serves predictions.

    Falls back to a pure prescribed-dose calculation (adherence assumed to
    be 100%) if the model artifact hasn't been trained yet, so the API
    never hard-fails — it just runs in "rule-based" mode with
    ``model_version = "fallback-rule-based"``.
    """

    def __init__(self, model_path: Path = MODEL_PATH, metadata_path: Path = METADATA_PATH):
        self.model = None
        self.metadata: dict[str, Any] = {}
        if model_path.exists():
            self.model = joblib.load(model_path)
        if metadata_path.exists():
            self.metadata = json.loads(metadata_path.read_text())

    @property
    def version(self) -> str:
        return self.metadata.get("version", "fallback-rule-based") if self.model else "fallback-rule-based"

    def _predict_adherence(self, feature_values: list[float]) -> float:
        if self.model is None:
            return 1.0
        pred = float(self.model.predict([feature_values])[0])
        return max(0.0, min(1.0, pred))

    def predict(
        self,
        medication: dict[str, Any],
        schedules: list[dict[str, Any]],
        dose_logs: list[dict[str, Any]] | None = None,
        today: date | None = None,
    ) -> RefillPrediction:
        today = today or date.today()
        dose_logs = dose_logs or []
        bundle = build_features(medication, schedules, dose_logs, today=today)
        prescribed = bundle.prescribed_daily_dose
        refill_lead_days = int(medication.get("refill_lead_days", 5) or 5)
        stock_quantity = float(medication.get("stock_quantity", 0) or 0)

        if prescribed <= 0:
            return RefillPrediction(
                medication_id=medication.get("id"),
                medication_name=medication.get("name"),
                prescribed_daily_dose=0.0,
                predicted_adherence_rate=0.0,
                adjusted_daily_dose=0.0,
                stock_quantity=stock_quantity,
                days_remaining=None,
                depletion_date=None,
                refill_by_date=None,
                stock_status="no-schedule",
                adherence_risk="insufficient-data",
                confidence=0.0,
                model_version=self.version,
            )

        adherence_rate = self._predict_adherence(bundle.values)
        confidence = min(1.0, bundle.log_count / MIN_LOGS_FOR_CONFIDENCE) if self.model else 0.0

        # Below the confidence floor we don't yet trust the learned
        # adherence estimate enough to deviate from "as prescribed" —
        # blend toward 1.0 proportionally to how little history we have.
        effective_adherence = confidence * adherence_rate + (1 - confidence) * 1.0
        adjusted_daily_dose = prescribed * effective_adherence

        days_remaining = int(stock_quantity // adjusted_daily_dose) if adjusted_daily_dose > 0 else None
        depletion_date = today + timedelta(days=days_remaining) if days_remaining is not None else None
        refill_by_date = depletion_date - timedelta(days=refill_lead_days) if depletion_date else None

        if days_remaining is None:
            stock_status = "no-schedule"
        elif days_remaining <= 0:
            stock_status = "empty"
        elif days_remaining <= refill_lead_days:
            stock_status = "low"
        else:
            stock_status = "ok"

        feat = bundle.as_dict()
        if bundle.log_count < 5:
            adherence_risk = "insufficient-data"
        elif feat["missed_streak"] >= 3 or (feat["adherence_trend"] < -0.15 and feat["adherence_volatility"] > 0.2):
            adherence_risk = "declining"
        elif feat["adherence_rate_14d"] < 0.75 or feat["adherence_trend"] < -0.05:
            adherence_risk = "watch"
        else:
            adherence_risk = "stable"

        return RefillPrediction(
            medication_id=medication.get("id"),
            medication_name=medication.get("name"),
            prescribed_daily_dose=round(prescribed, 3),
            predicted_adherence_rate=round(effective_adherence, 3),
            adjusted_daily_dose=round(adjusted_daily_dose, 3),
            stock_quantity=stock_quantity,
            days_remaining=days_remaining,
            depletion_date=depletion_date.isoformat() if depletion_date else None,
            refill_by_date=refill_by_date.isoformat() if refill_by_date else None,
            stock_status=stock_status,
            adherence_risk=adherence_risk,
            confidence=round(confidence, 3),
            model_version=self.version,
        )


_predictor: RefillPredictor | None = None


def get_predictor() -> RefillPredictor:
    global _predictor
    if _predictor is None:
        _predictor = RefillPredictor()
    return _predictor
