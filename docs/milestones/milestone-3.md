# Milestone 3 — OCR Recognition & Refill Prediction (Week 5–6)

- **Intern:** Vemula Purna Vijaya Sai Phani Kumar
- **Branch:** intern/22-vemula-purna-vijaya-sai-phani-kumar
- **Submitted on:** 2026-09-01

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| OCR medicine recognition operational | ☐ Not started | Out of scope for this pass — see note below |
| Extraction of name, dosage, quantity, frequency, prescription details | ☐ Not started | Manual entry (with dataset-backed autocomplete) covers this today; see `MedicationAutocomplete.jsx` |
| AI refill prediction system functional | ☑ Done | `frontend/src/lib/refillPrediction.js` (used in UI) + `ml/src/refill_prediction/predict.py` (reference implementation) |
| Medication adherence tracking completed | ☑ Done | `frontend/src/lib/adherence.js`, `features/adherence/AdherenceDashboard.jsx` |
| Refill notifications working correctly | ☑ Done | Low-stock/refill banner in `features/refills/RefillsPage.jsx`, sourced from `predictRefill()` |
| Low-stock alerts | ☑ Done | `RefillsPage.jsx` status badges (`ok` / `low` / `empty`), `medications.low_stock_threshold` |
| Adherence analytics (daily history, percentage, trends) | ☑ Done | `AdherenceDashboard.jsx` — overall %, 14-day trend chart, streak, per-medicine breakdown |

**Note on OCR:** OCR wasn't in the feature list this pass focused on (Medicine
Management, Scheduling, Reminders, Dose Tracking, History, Stock & Refill
Alerts, Adherence Dashboard). Doing it properly needs an OCR engine
(Tesseract/cloud OCR) plus a trained/tuned parser for messy handwriting —
real scope, so it's left honestly unstarted rather than stubbed out. The
medicine reference dataset added this milestone (`frontend/src/data/
medicationsDataset.json`, 74 entries) is exactly the lookup table an OCR
parser would fuzzy-match against, so it's a ready foundation for that work.

## Refill prediction logic

Rule-based (not a trained model) — documented and unit-tested rather than a
black box, which is the right scope given real quantities/frequencies are
exact inputs the patient already entered, not something that benefits from
being learned.

1. `dailyDose` = average units/day across all active schedules, honoring
   `days_of_week` (a 3x/week schedule contributes `qty * 3 / 7`/day).
2. `daysRemaining` = `floor(stock_quantity / dailyDose)`
3. `depletionDate` = today + `daysRemaining`
4. `refillByDate` = `depletionDate - refill_lead_days`

Worked example from the spec, reproduced as an automated test in both
`frontend/tests/unit/refillPrediction.test.js` and
`ml/tests/test_refill_prediction.py`:

| Input | Value |
|---|---|
| Initial quantity | 60 tablets |
| Daily dosage frequency | 1x/day |
| Quantity per dose | 2 tablets |
| Missed doses accounted for | Not projected forward — prediction uses the *scheduled* daily dose, not a rolling average of actual doses taken, so a missed dose doesn't shorten the predicted runway (see "Accuracy" below) |
| Predicted depletion date | 30 days from today |
| Recommended refill date | depletion date − `refill_lead_days` (default 5) |

## Accuracy

- OCR field-level accuracy on sample set: N/A — OCR not implemented this pass.
- Refill prediction error on test cases: 0% against the 5 worked cases in
  `ml/tests/test_refill_prediction.py` and `frontend/tests/unit/
  refillPrediction.test.js` (exact formula, not an estimator, so "accuracy"
  here means "matches the spec's arithmetic," which it does).
- Known limitation: because the formula uses the *scheduled* dose rather
  than actual `dose_logs` consumption, a patient who consistently misses
  doses will see a refill date sooner than they actually need one (stock
  lasts longer than predicted) — the safer direction to err in for a
  medication-adherence app, but worth knowing.
- Sample set used (synthetic / public domain only — no real patient data):
  `frontend/src/data/medicationsDataset.json` / `ml/data/samples/
  medications_dataset.json` — 74 hand-compiled common generic/brand
  medicine names, forms and typical strengths; no patient or prescription
  data of any kind.

## Tests

- Test files added: `frontend/tests/unit/refillPrediction.test.js`,
  `frontend/tests/unit/adherence.test.js`, `ml/tests/test_refill_prediction.py`
- What they cover: the spec's worked refill example, partial-week schedule
  averaging, low/empty/no-schedule status transitions, and adherence
  percentage/streak/per-medicine aggregation
- `pytest` result: **5/5 passing** (`python -m pytest ml/tests`)
- `npm test` result: **15/15 passing** (`vitest run`, includes Milestone 2's tests)

## Blockers and open questions

OCR prescription scanning is the one item from this milestone not attempted
— it's a genuinely separate body of work (image preprocessing, an OCR
engine, and a fuzzy parser against the medicine dataset) rather than
something to half-implement. Everything else in the milestone is complete
and tested.
