"""Module 6 service layer — wraps ``ml.src.refill_prediction`` for the API.

Kept deliberately thin: all the actual modelling logic lives in `ml/` so it
stays independently testable/trainable outside of any web framework. This
file only translates between Pydantic request models and the plain
dicts the ML package expects, and does the list-level aggregation
(summaries, sorting by urgency) that the patient and caregiver views need.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

# `ml/` lives at the repository root, one level above `backend/`, so it
# isn't necessarily importable from wherever the ASGI server or pytest was
# launched. Make the import robust to cwd by adding the repo root
# explicitly, rather than requiring a particular working directory or a
# PYTHONPATH env var to be set just right.
_REPO_ROOT = Path(__file__).resolve().parents[4]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from ml.src.refill_prediction.model import RefillPrediction, get_predictor  # noqa: E402

from ..schemas import (
    BatchPredictRequest,
    BatchPredictResponse,
    BatchSummary,
    CaregiverPredictRequest,
    CaregiverPredictResponse,
    MedicationCase,
    ModelHealth,
    PatientRefillSummary,
    PredictRequest,
    RefillPredictionOut,
)

URGENT_STATUSES = {"empty", "low"}
WATCH_RISKS = {"watch", "declining"}


def _to_out(pred: RefillPrediction) -> RefillPredictionOut:
    return RefillPredictionOut(**pred.to_dict())


def _run_case(case: MedicationCase, as_of: date | None) -> RefillPredictionOut:
    predictor = get_predictor()
    result = predictor.predict(
        medication=case.medication.model_dump(),
        schedules=[s.model_dump() for s in case.schedules],
        dose_logs=[d.model_dump() for d in case.dose_logs],
        today=as_of,
    )
    return _to_out(result)


def _summarize(predictions: list[RefillPredictionOut]) -> BatchSummary:
    return BatchSummary(
        total=len(predictions),
        urgent_count=sum(1 for p in predictions if p.stock_status in URGENT_STATUSES),
        adherence_watch_count=sum(1 for p in predictions if p.adherence_risk in WATCH_RISKS),
    )


def _sort_key(p: RefillPredictionOut):
    # Soonest depletion first; medications with no schedule sort last.
    return (p.days_remaining if p.days_remaining is not None else 10_000,)


def predict_one(payload: PredictRequest) -> RefillPredictionOut:
    case = MedicationCase(medication=payload.medication, schedules=payload.schedules, dose_logs=payload.dose_logs)
    return _run_case(case, payload.as_of)


def predict_batch(payload: BatchPredictRequest) -> BatchPredictResponse:
    predictions = [_run_case(case, payload.as_of) for case in payload.cases]
    predictions.sort(key=_sort_key)
    return BatchPredictResponse(predictions=predictions, summary=_summarize(predictions))


def predict_for_caregiver(payload: CaregiverPredictRequest) -> CaregiverPredictResponse:
    patients = []
    urgent_total = 0
    for patient in payload.patients:
        predictions = [_run_case(case, payload.as_of) for case in patient.cases]
        predictions.sort(key=_sort_key)
        summary = _summarize(predictions)
        urgent_total += summary.urgent_count
        patients.append(
            PatientRefillSummary(
                patient_id=patient.patient_id,
                patient_name=patient.patient_name,
                predictions=predictions,
                summary=summary,
            )
        )
    # Patients with the most urgent items float to the top for the caregiver.
    patients.sort(key=lambda p: (-p.summary.urgent_count, -p.summary.adherence_watch_count))
    return CaregiverPredictResponse(patients=patients, urgent_total=urgent_total)


def model_health() -> ModelHealth:
    predictor = get_predictor()
    meta = predictor.metadata
    return ModelHealth(
        model_loaded=predictor.model is not None,
        algorithm=meta.get("algorithm"),
        version=predictor.version,
        trained_at=meta.get("trained_at"),
        test_mae=meta.get("test_mae"),
        test_r2=meta.get("test_r2"),
    )
