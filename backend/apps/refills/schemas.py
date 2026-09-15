"""Pydantic schemas for Module 6 — AI Refill Prediction Engine.

Field names deliberately mirror the Supabase columns in
``docs/database/schema_m2_m3.sql`` (``medications``, ``medication_schedules``,
``dose_logs``) so the frontend can pass the rows it already fetched straight
through without remapping.
"""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class ScheduleIn(BaseModel):
    dose_quantity: float = 1
    days_of_week: list[int] = Field(default_factory=lambda: list(range(7)))
    is_active: bool = True


class DoseLogIn(BaseModel):
    scheduled_for: str  # ISO timestamp
    status: Literal["pending", "taken", "missed", "snoozed", "skipped"]
    dose_quantity: float = 1


class MedicationIn(BaseModel):
    id: str | None = None
    name: str | None = None
    form: str | None = None
    therapeutic_class: str | None = None
    stock_quantity: float = 0
    low_stock_threshold: float = 5
    refill_lead_days: int = 5


class PredictRequest(BaseModel):
    medication: MedicationIn
    schedules: list[ScheduleIn] = Field(default_factory=list)
    dose_logs: list[DoseLogIn] = Field(default_factory=list)
    as_of: date | None = None


class RefillPredictionOut(BaseModel):
    medication_id: str | None
    medication_name: str | None
    prescribed_daily_dose: float
    predicted_adherence_rate: float
    adjusted_daily_dose: float
    stock_quantity: float
    days_remaining: int | None
    depletion_date: str | None
    refill_by_date: str | None
    stock_status: Literal["no-schedule", "empty", "low", "ok"]
    adherence_risk: Literal["insufficient-data", "stable", "watch", "declining"]
    confidence: float
    model_version: str


class MedicationCase(BaseModel):
    medication: MedicationIn
    schedules: list[ScheduleIn] = Field(default_factory=list)
    dose_logs: list[DoseLogIn] = Field(default_factory=list)


class BatchPredictRequest(BaseModel):
    cases: list[MedicationCase]
    as_of: date | None = None


class BatchSummary(BaseModel):
    total: int
    urgent_count: int  # stock_status in (empty, low)
    adherence_watch_count: int  # adherence_risk in (watch, declining)


class BatchPredictResponse(BaseModel):
    predictions: list[RefillPredictionOut]
    summary: BatchSummary


class PatientCase(BaseModel):
    patient_id: str
    patient_name: str | None = None
    cases: list[MedicationCase] = Field(default_factory=list)


class CaregiverPredictRequest(BaseModel):
    patients: list[PatientCase]
    as_of: date | None = None


class PatientRefillSummary(BaseModel):
    patient_id: str
    patient_name: str | None
    predictions: list[RefillPredictionOut]
    summary: BatchSummary


class CaregiverPredictResponse(BaseModel):
    patients: list[PatientRefillSummary]
    urgent_total: int


class ModelHealth(BaseModel):
    model_loaded: bool
    algorithm: str | None
    version: str
    trained_at: str | None
    test_mae: float | None
    test_r2: float | None
