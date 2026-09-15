# refills — Module 6: AI Refill Prediction Engine

**Status: implemented.** FastAPI service backed by a trained ML model.

## What it does

Inputs: current stock, dosage schedule(s), and (when available) the
patient's recent `dose_logs` adherence history.

Computes: predicted future adherence rate (ML), ML-adjusted daily
consumption, days of stock remaining, estimated depletion date, recommended
refill-by date, a stock-status flag, and a separate adherence-risk flag.

This is a **hybrid** design, not a pure lookup formula and not a black-box
model:

- Prescribed daily dose and calendar math (depletion date, refill-by date)
  are computed exactly from the schedule — no need to "learn" arithmetic.
- How much medicine the patient will *actually* take is predicted by a
  model trained on adherence patterns (`ml/src/refill_prediction`), so a
  consistently under-adherent patient is correctly predicted to run out
  *later* than the naive "stock / prescribed dose" formula would say, and a
  patient sliding into a missed-dose streak is flagged as an adherence risk
  even before their stock count looks low.

See `ml/src/refill_prediction/train.py` for how the model is trained and
selected (Linear Regression vs Random Forest vs Gradient Boosting,
picked by cross-validated MAE — currently Gradient Boosting).

## Files

| File | Purpose |
|---|---|
| `schemas.py` | Pydantic request/response models (mirrors the Supabase `medications` / `medication_schedules` / `dose_logs` columns) |
| `services/prediction.py` | Thin bridge from the API schemas to `ml.src.refill_prediction`, plus batch/caregiver aggregation and urgency sorting |
| `router.py` | `POST /api/v1/refills/predict`, `/predict/batch` (one patient), `/predict/caregiver` (many patients, sorted by urgency), `GET /health` |
| `tests/test_router.py` | End-to-end API tests via FastAPI's `TestClient` |

Wired into the app at `backend/config/main.py`. Both the **patient** Refills
page and the **caregiver** dashboard call this API (see
`frontend/src/features/refills/mlApi.js`).

> Worked example from the spec — 60 tablets at 2/day ⇒ 30 days of supply ⇒
> *"Your BP medicine is expected to finish in 5 days. Please arrange a refill."*
> (Covered by `test_predict_matches_spec_worked_example`.)

**Milestone:** 3 (Week 5–6)

