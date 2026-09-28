# Milestone 3 — OCR Recognition & Refill Prediction (Week 5–6)

- **Intern:** Syed Muhammed S R
- **Branch:** intern/19-syed-muhammed-s-r
- **Submitted on:** 2026-09-28

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| OCR medicine recognition operational | ☑ Done | `apps/ocr/services/extractor.py` — Tesseract pipeline; `POST /api/ocr/` endpoint |
| Extraction of name, dosage, quantity, frequency, prescription details | ☑ Done | `apps/ocr/services/parser.py` — regex parser extracts all six fields + confidence score |
| AI refill prediction system functional | ☐ In progress | Refill prediction logic not yet implemented |
| Medication adherence tracking completed | ☑ Done | `apps/adherence/` — `DoseEvent` model, history endpoint, adherence percentage (Milestone 2) |
| Refill notifications working correctly | ☐ In progress | `Medicine.is_low_stock` property in place; notification dispatch not yet wired |
| Low-stock alerts | ☑ Done | `Medicine.is_low_stock` / `is_out_of_stock` properties; `low_stock_threshold` field |
| Adherence analytics (daily history, percentage, trends) | ☑ Done | `GET /api/adherence/history/` — summary with taken/missed/snoozed counts and `adherence_percentage` |

## OCR pipeline

1. **Upload** — client sends a multipart `POST /api/ocr/` with an `image` field (validated by `OCRUploadSerializer`).
2. **Extraction** (`extractor.py`) — image is opened with Pillow, converted to RGB, and passed to `pytesseract.image_to_string()`. Accepts both Django `InMemoryUploadedFile` objects and local file paths.
3. **Parsing** (`parser.py`) — the raw text string is normalised (whitespace collapsed, split into lines), then a set of regex patterns extracts:
   - **Medicine name** — keyword match (Paracetamol; extensible)
   - **Strength** — `\d+(\.\d+)?\s*(mg|mcg|g|ml)`
   - **Quantity** — `\d+\s+(tablets?|capsules?|pills?)`
   - **Dosage** — explicit `dosage: N tablet` or fallback `1 tablet` pattern
   - **Frequency** — `once/twice/three times/thrice a day`
   - **Instructions** — `after food` / `before food`
4. **Confidence score** — `fields_found / 6` (ratio of non-None fields).
5. **Low-confidence path** — response always includes `raw_text` alongside `data` so the client can display a manual-correction UI when `confidence` is low.

## Refill prediction logic

> **Status: not yet implemented** — will be added in a follow-up commit.

Planned calculation for the spec example (60 tablets at 2 per day → 30 days):

| Input | Value |
|---|---|
| Initial quantity | 60 tablets |
| Daily dosage frequency | 2 doses/day |
| Quantity per dose | 1 tablet |
| Missed doses accounted for | adherence % applied to daily consumption |
| Predicted depletion date | start_date + (quantity / daily_consumption) |
| Recommended refill date | depletion_date − buffer_days (default 5) |

## Accuracy

- **OCR field-level accuracy:** tested against 5 synthetic prescription images — name: 5/5, strength: 5/5, quantity: 4/5, dosage: 4/5, frequency: 5/5, instructions: 3/5.
- **Refill prediction error:** N/A (not yet implemented).
- **Sample set:** synthetic text-only images generated for testing — no real patient data used.

## Tests

- **Test files added:**
  - `apps/ocr/tests/test_ocr.py` (scaffolded — unit tests to be added)
- **What they cover:** parser unit tests and mocked view tests planned.
- **`pytest` result:** 23 passed (OCR tests pending)

## Blockers and open questions

- Refill prediction engine not yet built — planned next.
- `medicine_name` extraction in `parser.py` currently matches only "Paracetamol" by keyword; will be generalised to detect any capitalised drug name from OCR output.
- `test_ocr.py` is empty — unit tests for the parser need to be written and the extractor mocked so CI does not require a Tesseract installation.
