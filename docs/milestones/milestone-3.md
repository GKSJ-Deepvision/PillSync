# Milestone 3 — OCR Recognition & Refill Prediction (Week 5–6)

- **Intern:** Rajasri Nallamilli
- **Branch:** intern/03-rajasri-nallamilli
- **Submitted on:** 2026-09-26

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| OCR medicine recognition operational | ☑ Done | `ml/src/ocr/recognizer.py`, `backend/apps/ocr/` |
| Extraction of name, dosage, quantity, frequency, prescription details | ☑ Done | `backend/apps/ocr/views.py`, `frontend/src/features/ocr/` |
| AI refill prediction system functional | ☑ Done | `ml/src/refill_prediction/engine.py`, `backend/apps/refills/` |
| Medication adherence tracking completed | ☑ Done | `backend/apps/adherence/`, `frontend/src/features/adherence/` |
| Refill notifications working correctly | ☑ Done | `backend/apps/notifications/`, `frontend/src/pages/patient/NotificationsPage.jsx` |
| Low-stock alerts | ☑ Done | `frontend/src/features/refills/RefillPredictionCard.jsx` |
| Adherence analytics (daily history, percentage, trends) | ☑ Done | `backend/apps/analytics/`, `frontend/src/features/analytics/AdherenceTrendsChart.jsx` |

## OCR pipeline

- Preprocessing steps: Contrast enhancement, noise filtering, and thresholding.
- Parsing approach: Pattern matching extracting medicine name, dosage amount (e.g. 500mg), pill quantity (e.g. 60 pills), and frequency (e.g. twice daily).
- Fallback rules applied when OCR confidence is below threshold to ensure reliable user editing.

## Refill prediction logic

Spec worked example calculation: **60 tablets at 2 per day predicts 30 days of supply**.

| Input | Value |
|---|---|
| Initial quantity | 60 Tablets |
| Daily dosage frequency | 2.0 per day |
| Quantity per dose | 1.0 Tablet |
| Missed doses accounted for | 0 |
| Predicted depletion date | +30 Days |
| Recommended refill date | +25 Days (5-day safety lead buffer) |

## Accuracy

- OCR field-level accuracy on synthetic sample set: 95%
- Refill prediction error on test cases: 0 days (100% exact math calculation)
- Sample set used: Synthetic prescription label image samples in `ml/data/samples/`.

## Tests

- Test files added:
  - `backend/apps/refills/tests/test_refills.py`
  - `backend/apps/analytics/tests/test_analytics.py`
  - `backend/apps/ocr/tests/test_ocr.py`
  - `backend/apps/notifications/tests/test_notifications.py`
- What they cover:
  - Worked example stock depletion logic (60 tablets / 2 per day = 30 days remaining).
  - Low-stock warning alert generation when stock ≤ 5 days.
  - Adherence analytics calculation and weekly trend breakdown.
  - OCR prescription text extraction and field parsing.
  - Refill notification and caregiver alert workflows.
- `pytest` result: All 11 backend and ML unit tests passed in 0.87s.

## Blockers and open questions

None.
