"""HTTP routes for Module 6 — AI Refill Prediction Engine.

    POST /api/v1/refills/predict           one medication -> one prediction
    POST /api/v1/refills/predict/batch     a patient's medications -> predictions + summary
    POST /api/v1/refills/predict/caregiver multiple patients -> per-patient summaries, most urgent first
    GET  /api/v1/refills/health            which model is currently loaded

The **patient** dashboard/Refills page calls the batch endpoint with just
its own medications. The **caregiver** dashboard calls the caregiver
endpoint with every linked patient's medications in one request so it can
show a single "who needs a refill" view sorted by urgency, without asking
the frontend to re-implement sorting/aggregation.
"""

from __future__ import annotations

from fastapi import APIRouter

from .schemas import (
    BatchPredictRequest,
    BatchPredictResponse,
    CaregiverPredictRequest,
    CaregiverPredictResponse,
    ModelHealth,
    PredictRequest,
    RefillPredictionOut,
)
from .services import prediction as service

router = APIRouter(prefix="/api/v1/refills", tags=["refills"])


@router.get("/health", response_model=ModelHealth)
def health() -> ModelHealth:
    return service.model_health()


@router.post("/predict", response_model=RefillPredictionOut)
def predict(payload: PredictRequest) -> RefillPredictionOut:
    return service.predict_one(payload)


@router.post("/predict/batch", response_model=BatchPredictResponse)
def predict_batch(payload: BatchPredictRequest) -> BatchPredictResponse:
    return service.predict_batch(payload)


@router.post("/predict/caregiver", response_model=CaregiverPredictResponse)
def predict_caregiver(payload: CaregiverPredictRequest) -> CaregiverPredictResponse:
    return service.predict_for_caregiver(payload)
