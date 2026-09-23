# Milestone 3 — OCR Recognition & Refill Prediction (Week 5–6)

- **Intern:** Advala Indhu
- **Branch:** intern/01-advala-indhu
- **Submitted on:** <fill in once pushed and verified live>

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| OCR extracting name, dosage, quantity, frequency | ☑ Done | `backend/apps/ocr/services.py` (`run_ocr`, `parse_fields`) + `backend/apps/ocr/views.py` (`POST /api/ocr/scan/`). Verified end-to-end with a real generated label image — Tesseract correctly read the medicine name and frequency; dosage/quantity extraction is regex-based and unit-tested separately from image quality. |
| Refill prediction engine | ☑ Done | `backend/apps/refills/services.py` — matches the spec's example exactly (60 tablets ÷ 2/day = 30 days), plus depletion date, recommended refill-by date, and low-stock flag. `POST /api/refills/check/` in `backend/apps/refills/views.py`. |
| Adherence tracking with percentages and trends | ☑ Done | Built in Milestone 2 (`frontend/src/features/adherence/HistoryPage.jsx`, `frontend/src/lib/scheduling.js`); intern guide's module table places this under M3, but the working code has existed since M2 and is unchanged here. |
| Refill and low-stock notifications | ☑ Done | `backend/apps/refills/services.py::refill_notification_message` matches the spec's exact wording ("Your BP medicine is expected to finish in 5 days. Please arrange a refill."). Surfaced in the refill-check response and shown in `frontend/src/features/refills/RefillsPage.jsx` when stock is low. |

## What I built

This milestone required real Python — OCR needs Tesseract, which Supabase can't provide — so it's the first genuine Django backend work on this branch, alongside the two apps from the spec's module table: `backend/apps/ocr/` and `backend/apps/refills/`.

**OCR**: `POST /api/ocr/scan/` accepts a patient ID and an image (multipart form), runs it through Tesseract via `pytesseract`, and parses the raw text with regex into medicine name, dosage, quantity, and frequency. The parsing logic (`parse_fields`) is a pure function — it takes text in and structured fields out, with no Django or image dependency — specifically so it can be unit-tested against known strings without needing an actual image or Tesseract installed in CI. Extraction is best-effort: it's designed to pre-fill an "Add medicine" form for the patient to review and correct, not to be authoritative on its own.

**Refill prediction**: `POST /api/refills/check/` takes a medicine's current quantity and daily consumption rate and returns days remaining, an estimated depletion date, a recommended refill-by date (with a configurable lead-time buffer), and whether it's currently low stock. The core math (`days_of_stock_remaining`) is the same formula as the spec's worked example. Every check is persisted to a `RefillCheck` row for history/audit.

**Frontend integration**: `frontend/src/features/ocr/ScanPage.jsx` lets a patient upload a label photo, see what was extracted, and jump straight into "Add medicine" with those fields pre-filled. `frontend/src/features/refills/RefillsPage.jsx` lets a patient enter their on-hand quantity and daily usage per medicine and see the prediction, with a red "Low stock" banner and the exact spec-wording message when relevant. Both call the Django API via a small client (`frontend/src/lib/apiClient.js`), kept separate from `supabaseClient.js` since this milestone's backend is Django, not Supabase.

## Database design

Two new Django-managed tables, living in the same PostgreSQL database (SQLite locally if no DB env is configured, matching the intern guide's dev flexibility):

| Table | Purpose |
|---|---|
| `ocr_prescriptionscan` | One row per uploaded image: the image file itself, the raw OCR text, and the parsed fields. `patient_id` is a UUID referencing `profiles.id` in Supabase's schema — not a Django FK, since the user table lives in Supabase's Auth/Postgres, not Django's. |
| `refills_refillcheck` | One row per refill calculation: quantity on hand, daily consumption, and the computed days remaining / depletion date / refill-by date / low-stock flag. `medication_id` and `patient_id` are UUIDs referencing the frontend's `medications` and `profiles` tables the same way. |

This intentionally keeps Django's database separate from direct foreign-key coupling to Supabase's tables — the two are related by UUID convention, not a real cross-database constraint, which is the correct pattern when the frontend and backend own different pieces of the schema.

## How to run and verify it

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements/dev.txt

cp .env.example .env
# fill in SUPABASE_DB_HOST etc. to point at the same Postgres as the
# frontend, or leave blank to use local SQLite for quick testing

python manage.py migrate
python manage.py runserver

# separately, in frontend/.env, set:
#   VITE_API_BASE_URL=http://localhost:8000

black --check .
isort --check-only .
ruff check .
python manage.py check
pytest
```

Then in the running frontend app: `/medications` → **Scan a label** to test OCR, or **Refill check** to test the prediction engine against a real medicine.

## Tests

- Test files added: `backend/apps/ocr/tests/test_services.py`, `backend/apps/ocr/tests/test_views.py`, `backend/apps/refills/tests/test_services.py`, `backend/apps/refills/tests/test_views.py`.
- What they cover: OCR field-parsing against known text strings (dosage, quantity, frequency, medicine-name heuristics, empty-input handling); the OCR upload endpoint with a mocked extraction call; the refill math against the spec's exact worked example plus edge cases (zero consumption, low-stock threshold boundaries); the refill-check endpoint's validation and response shape.
- `pytest` result: 21 passed, 0 failed.
- Also verified live: ran real Tesseract OCR against a generated test label image outside the test suite, confirming the pipeline works end-to-end with actual image input, not just mocked calls.

## Blockers and open questions

None currently blocking. This milestone is the natural point to resolve the Supabase-vs-Django question flagged in Milestones 1 and 2: OCR and refill prediction now live in Django because they need Python/Tesseract, while auth, profiles, medications, reminders, and notifications remain on Supabase. If the mentor prefers everything consolidated on one backend going forward, Milestone 4 would be the point to migrate the Supabase-hosted pieces into Django, or alternatively to have Django proxy through to the same Postgres tables Supabase already manages.
