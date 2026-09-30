# Milestone 3 — OCR Recognition & Refill Prediction (Week 5–6)

- **Intern:** Reference implementation (mentor-maintained, on `main`)
- **Branch:** `main`
- **Submitted on:** 2026-09-30

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| OCR medicine recognition operational | Done | [`apps/ocr/`](../../backend/apps/ocr) — Tesseract behind a pluggable engine, verified against the real binary inside the backend image; Scan page in the app |
| Extraction of name, dosage, quantity, frequency, prescription details | Done | [`services/parser.py`](../../backend/apps/ocr/services/parser.py) — medicine name, strength, form, dose times, frequency (daily / weekly / alternate / chosen days), course length, quantity, instructions; header: doctor, clinic, date, reference, patient, expiry. 134 parser tests |
| AI refill prediction system functional | Done | [`apps/refills/engine.py`](../../backend/apps/refills/engine.py) — blends the schedule with observed use; [architecture notes](../architecture/ocr-and-refills.md) |
| Medication adherence tracking completed | Done | [`apps/adherence/`](../../backend/apps/adherence) — definitions, streaks, consistency, missed-dose patterns; verified against an independent calculation |
| Refill notifications working correctly | Done | [`services/alerts.py`](../../backend/apps/refills/services/alerts.py) and `notify_refill` — once per level, reset by a refill, caregivers included |
| Low-stock alerts | Done | Superseded the M2 fixed-threshold warning: alerts now come from the forecast (days left), with the old threshold as a fallback when a medicine has no schedule |
| Adherence analytics (daily history, percentage, trends) | Done | `GET /api/v1/adherence/summary/`, weekly and monthly reports with CSV; Adherence page |

## What I built

**Four apps.** `ocr` turns a photo or pasted text into medicines for the patient
to review. `refills` predicts when each medicine runs out, keeps the stock ledger,
and decides when to warn. `adherence` computes how consistently doses are taken.
`analytics` (Milestone 4) draws them together. Full design and the reasoning
behind it: [`docs/architecture/ocr-and-refills.md`](../architecture/ocr-and-refills.md).

**Frontend.** A *Scan a prescription* page (take a photo, choose a file, or paste
text; review and correct each medicine; confirm), a *Refills* page (forecast list,
a stock projection chart with the refill-by and runs-out markers, "I collected a
refill" and "set the count"), and an *Adherence* page (rings, day-by-day chart,
where misses cluster, weekly/monthly report with CSV).

## OCR pipeline

1. **Validate** the upload: size, format, minimum and maximum dimensions (the pixel
   count is checked from the header before decoding, so a small crafted file cannot
   expand into gigabytes), and that it opens as an image at all.
2. **Preprocess** with Pillow only: orientation, grayscale, upscaling small images,
   contrast.
3. **Read** with Tesseract via `image_to_data`, keeping a confidence for each word.
   The engine is a dotted path in settings, so a hosted engine can replace it.
4. **Parse** with deterministic rules — no model — over the layouts real
   prescriptions use (`1-0-1`, `BD`/`TDS`/`OD`, "twice daily", "every 8 hours",
   weekly and alternate-day, numbered lists, lines run together, OCR digit
   confusions).
5. **Match** each name to the 3,111-presentation FDA catalogue with fuzzy matching
   and generic ⇄ brand alias tables. A confident match is applied; a doubtful one is
   only *suggested*.
6. **Review.** Nothing is saved until the patient confirms. Each field is editable,
   with the raw line and the reasons a field is doubtful shown alongside.

**When confidence is low** the app says so and errs toward the patient:

- The reader's own confidence is shown; below 0.45 a "hard to read, retake it in
  better light" warning appears.
- Below 0.5, **every catalogue match is downgraded to a suggestion** — a misread
  name can look like a different real drug (the evaluation found one case).
- A medicine with no dose times is kept, with the reason "No dose times found",
  never dropped; two medicines on one line are both extracted.
- Assumptions are named ("Written as once daily with no time, so morning was
  assumed", "Quantity worked out as 60, not printed on the page").
- A patient whose photo will not read can paste the text and take the same path.

## Refill prediction logic

```
average daily use = w × observed + (1 − w) × scheduled       w = min(1, resolved doses ÷ 10)
days remaining    = stock ÷ average daily use
runs out on       = today + floor(days remaining)
refill by         = runs out − 5 days
```

The worked example — the specification's own case, run through
[`engine.py`](../../backend/apps/refills/engine.py) (today = 1 March 2026):

| Input | Value |
|---|---|
| Initial quantity | 60 tablets |
| Daily dosage frequency | twice a day (morning and evening) |
| Quantity per dose | 1 tablet — so 2 a day |
| Missed doses accounted for | None in this case (weight 0: the schedule is used). With 22 tablets taken in the last 14 days instead of the scheduled 28, observed use is 1.57 a day and the forecast moves from 30 days to 38.2 |
| Predicted depletion date | **31 March 2026** (60 ÷ 2 = 30 days) |
| Recommended refill date | **26 March 2026** (5 days before) |

More cases (nearly out, course ends first, short history) are in the architecture
notes. **Manual stock updates** — the fifth input in the specification — go
through `POST /medicines/{id}/adjust-stock/`, which overrules the running total
(stock is only ever an estimate) and keeps the replaced figure in the ledger.

**Alerts** fire when the status *worsens* — low, then critical, then out — once each,
and reset when stock recovers, so a patient is never warned repeatedly about the
same shortfall. Caregivers with alerts enabled are told too.

## Accuracy

**OCR — field-level, on a synthetic set** (40 prescriptions, 120 medicines, seven
prescribing styles, real drug names from the catalogue, read by real Tesseract 5.5;
[full report](../reports/ocr-evaluation.md)):

| Condition | Found | Name | Strength | Doses/day | Course length | Wrong drug attached automatically |
|---|---:|---:|---:|---:|---:|---:|
| Clean text | 100% | 100% | 100% | 100% | 100% | 0 |
| Page skewed up to ±2.5° | 100% | 100% | 99.2% | 95.0% | 98.3% | 0 |
| Badly degraded image | 22.5% | 85.2% | 92.6% | 48.1% | 44.4% | 0 (23 matches downgraded to suggestions) |

**Refill prediction — on 1,000 simulated patients** ([full report](../reports/refill-evaluation.md)):
mean run-out date error **5.3 days** (schedule alone: 8.9); **57%** within ±2 days
and **78%** within ±5; 100% warned before running out with a median 6 days' notice.
Patients whose habits are *changing* remain the weak spot (about 13 days' error).

**Sample sets used:** entirely synthetic. Real prescriptions are medical records
and no public labelled set exists; the images are rendered text in one typeface,
and the patients are simulated. These figures show the methods work and how the
alternatives rank — **not** the accuracy real photographs or real patients would
give. Handwriting is outside what Tesseract reads reliably.

## What testing found in this milestone

The evaluations found real bugs that a green test suite had not:

- A form word after the strength ("500mg **tablet** twice daily") split the line in
  two and dropped the frequency for one style in six — a medicine with no
  reminders. Fixed, 12 regression tests.
- On badly read pages one misread name was auto-matched to the wrong drug. Fixed:
  a poor read means suggest, never apply.
- Adding a medicine by scan skipped the stock ledger and forecast. Fixed and tested.
- "Metformn" was saved verbatim. Fixed for near-misses only; "Paracetamol" is never
  rewritten to "Acetaminophen".

Details in the [testing report](../reports/testing-report.md).

## Tests

- **Files added:** `apps/ocr/tests/` (parser, matcher, API, Tesseract), `apps/refills/tests/`
  (engine, API, backtest), `apps/adherence/tests/`, `apps/analytics/tests/`,
  `tests/integration/test_end_to_end.py`, `ml/tests/test_evaluations.py`; frontend
  tests for charts, scan review, refills and adherence views.
- **What they cover:** the parser against real layouts; the matcher against the real
  catalogue (look-alike drugs never auto-match); upload validation and access
  control; the review-and-confirm flow; the specification's refill example; alert
  de-duplication; adherence definitions against an independent calculation; an
  end-to-end walk through the public API.
- **Result:** backend **628** (624 locally; the 4 Tesseract tests need the binary
  and pass in the backend Docker image), frontend **142**, ML **31** — all pass.
  Backend line coverage 89.7%.

## Blockers and open questions

None blocking. Known limits, stated openly:

- **Handwritten prescriptions** are not supported; the engine seam is ready for a
  hosted engine (Google Vision, Azure Document Intelligence).
- **spaCy / OpenAI parsing** was not used: the rule-based parser is deterministic
  and keeps the prescription on the server. An LLM is the natural next step for
  free-text instructions the rules do not cover.
- **Notifications** use the console provider without credentials; delivery to a
  real device or inbox is untested.
- **The forecast has no trend term**, so a patient whose adherence is falling is
  predicted late.
- **Uploaded photos** live on the server's disk; object storage is described in the
  deployment guide, not implemented.
