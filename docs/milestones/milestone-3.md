# Milestone 3 — OCR Recognition & Refill Prediction (Week 5–6)

- **Intern:** Ashritha Gowthami Nelakurthi
- **Branch:** `intern/24-nelakurthi-ashritha-gowthami`
- **Submitted on:** 28 September 2026

## Evaluation criteria

| Criterion | Status | Evidence |
|---|---|---|
| OCR medicine recognition operational | Not my assigned task | — |
| Extraction of name, dosage, quantity, frequency, prescription details | Not my assigned task | — |
| **AI refill prediction system functional** | **Done** | `backend/apps/refills/services/prediction.py`, `backend/apps/refills/views.py` |
| **Dosage analysis workflow implemented** | **Done** | `backend/apps/refills/services/prediction.py` |
| Refill notifications working correctly | Not my assigned task | — |
| Low-stock alerts | **Implemented in prediction status** | `backend/apps/refills/services/prediction.py` |
| Medication adherence analytics | Not my assigned task | — |

## Refill prediction logic

Inputs:
- Current medicine quantity
- Active medication schedules
- Quantity per dose
- Schedule frequency / selected days
- Low-stock threshold

Formula:

`Daily stock consumption = sum(quantity per dose × average daily schedule occurrences)`

`Days remaining = quantity remaining / daily stock consumption`

`Predicted depletion date = today + floor(days remaining)`

`Recommended refill date = predicted depletion date - 5 days`

Required specification example:

`60 tablets ÷ 2 tablets/day = 30 days of supply`

The API returns `OK`, `LOW_STOCK`, `REFILL_DUE`, `OUT_OF_STOCK`, or `NO_ACTIVE_DOSAGE`.

## Dosage analysis workflow

Medication → Active Schedule → Frequency → Weekly Occurrences → Average Daily Dose → Daily Stock Consumption → Refill Prediction

The dosage analysis response contains:
- medicine
- strength
- dose quantity
- slot
- scheduled time
- frequency
- selected days
- weekly occurrences
- average daily doses
- daily stock consumption
- remaining quantity

## API

- `GET /api/refills/predictions/?patient=<patient_id>`
- `GET /api/refills/predictions/<medicine_id>/?patient=<patient_id>`
- `GET /api/refills/dosage-analysis/?patient=<patient_id>`

Optional prediction parameter:

`lead_days=5` (valid range 0–30)

## Tests

`backend/apps/refills/tests/test_prediction.py`

Covers:
- 60 tablets / 2 per day specification case
- multiple daily schedules
- refill-due threshold
- low stock
- out of stock
- missing active dosage
- refill prediction API
- dosage analysis API

Run:

```powershell
cd backend
python -m pytest apps/refills/tests/test_prediction.py -q
python manage.py check
```

## Accuracy

This implementation is a deterministic schedule/stock prediction engine rather than a trained ML model. It is intentionally transparent and testable for the milestone's refill-prediction workflow.
