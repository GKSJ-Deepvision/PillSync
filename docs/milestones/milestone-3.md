# Milestone 3 â€” OCR Recognition & Refill Prediction (Week 5â€“6)

- **Intern:** Advala Indhu
- **Branch:** intern/01-advala-indhu
- **Submitted on:** 23 September 2026

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| OCR medicine recognition operational | â˜‘ Done (printed/typed) Â· â˜ Not connected (handwriting/poor-quality: reader built and tested, no live API key) | `backend/apps/ocr/engine/` (`extractor.py`, `parser.py`, `vision.py`, `pipeline.py`), `POST /api/ocr/scan/` in `backend/apps/ocr/views.py` |
| Extraction of name, dosage, quantity, frequency, prescription details | â˜‘ Done | `parser.py` returns one entry per medicine: name, strength, units per dose, doses per day, times of day, duration, quantity, food instruction, plus doctor, date, expiry and refills. Review screen: `frontend/src/features/ocr/ScanPage.jsx` â€” confirmed live in browser: 4/4 medicines read correctly from a real upload |
| AI refill prediction system functional | â˜‘ Done (schedule-based) | `refill_forecast()` in `frontend/docs/database/schema-milestone3.sql`; page `frontend/src/features/refills/RefillsPage.jsx` â€” confirmed live: forecast, "I bought"/"Recount" actions, stock bar all working |
| Medication adherence tracking completed | â˜‘ Done | Dose logging from M2 + `adherence_daily/weekly/by_medication/by_slot()` SQL functions |
| Refill notifications working correctly | â˜‘ Done | `check_refills()` / `check_refills_all()` write `refill` rows to `notifications` for the patient and accepted caregivers |
| Low-stock alerts | â˜‘ Done | `is_low_stock` in the forecast; alert throttled to one per medicine per 24 h and re-armed when stock is added |
| Adherence analytics (daily history, percentage, trends) | â˜‘ Done | `frontend/src/features/adherence/AdherenceReportPage.jsx` â€” confirmed live: weekly %, 8-week trend, per-medicine, per-time-of-day, streak, print to PDF, linked from History page |

## OCR pipeline

1. **Validation** (`pipeline.validate_upload`): JPG/PNG/WebP only, max 10 MB, checked with Pillow rather than the file name.
2. **Preprocessing** (`extractor.preprocess`): grayscale, upscale to 1500 px wide, denoise, adaptive threshold. Reads the Tesseract binary path from `TESSERACT_CMD` (Django setting), so it works whether or not Tesseract is on the system `PATH`.
3. **OCR**: Tesseract with `--oem 3 --psm 6` (keeps one medicine per line); mean word confidence and word count are recorded.
4. **Parsing** (`parser.py`): the text is split into one block per medicine (numbered lines, `Tab./Cap.` prefixes, or `NAME strength` lines); wrapped lines join the block above; footer text (advice, follow-up, charts) is excluded. Each block is parsed for strength, per-dose units, frequency (`1-0-1`, `OD/BD/TDS/QID`, `HS`, `SOS`, "3X a day", table rows like `1 Morning, 1 Night`), duration, quantity (printed, or calculated as units Ã— doses Ã— days), and food instructions. Layouts handled: list, table, and pharmacy label. Duplicate photos of the same label are merged.
5. **Cross-check**: a printed quantity that differs from units Ã— doses Ã— days is flagged.
6. **Low confidence / handwriting / cluttered photos**: if mean confidence is below 65, fewer than 25 words are readable, or no medicine is found, the image is sent to the vision reader (`vision.py`, provider set by `PILLSYNC_VISION_PROVIDER`). Its JSON is range-checked and cross-checked; low-confidence results always require confirmation. **Without a configured API key, the user gets a clear "enter manually" warning and can add medicines by hand rather than risk saving unreliable data.** No paid API key was available for this submission (see Blockers).
7. **Human confirmation**: nothing is saved by the scan. The review screen shows one editable card per medicine and requires the user to tick a confirmation box before "Save" is enabled â€” confirmed live.

## Refill prediction logic

- `remaining = counted stock + purchases âˆ’ units taken since the count` (a recount starts a new count, so doses are never subtracted twice)
- `daily_use = scheduled daily use` â€” **schedule-based**, matching the spec's worked example directly (60 tablets at 2/day â†’ 30 days). An adherence-adjusted version (daily use scaled by the last 14 days of actual taken/missed doses, clamped 50â€“100%) was built, tested, and run live, but was reverted to the simpler schedule-only calculation for this submission so the number always matches the printed dosing instructions exactly.
- `days_left = remaining Ã· daily_use`; depletion date = today + days_left; recommended refill date = depletion âˆ’ 5 days; low stock when days_left â‰¤ 5.

Spec case, confirmed live in the running app: 60 tablets at 2 per day â†’ 30 days.

## Live verification

All three new screens were exercised in the running app (Chrome, `localhost:5173` / `localhost:8000`), not just in automated tests:

- **Scan** (`/scan`): uploaded a real multi-medicine prescription image â†’ 4 medicine cards returned, each with strength, per-dose amount, duration and food instruction pre-filled and editable; saved successfully to the Medicines list.
- **Refills** (`/refills`): a medicine with a stock count showed a live forecast ("About 15 days left Â· 10 left Â· 1/day", depletion and reorder dates), plus working "I bought" and "Recount now" actions.
- **Weekly adherence report** (`/adherence-report`, linked from the History page): showed this-week %, comparison to the previous week, perfect-day streak, a daily bar chart, an 8-week trend, per-medicine and per-time-of-day breakdowns, auto-generated insight text, and a working "Print / save as PDF" button. Numbers matched the existing History page's 30-day total.

## A real-world OCR limitation found and documented (not fixed)

A photo of an actual medicine blister strip (Sitagliptin 50 mg, foil packaging, 447Ã—447 px) was tested. Tesseract OCR confidence was 23.9%, well below the 65% threshold. Three preprocessing strategies were tried (CLAHE contrast + sharpening, denoise + adaptive threshold, and cropping to the single highest-confidence text region) â€” none improved readability past ~20%, confirming the limit is the photo itself (small size, foil glare), not the pipeline. The app correctly refused to guess and showed the "enter manually" fallback instead of saving unreliable data. This is exactly the case the (currently unconnected) vision reader is meant to handle.

## Tests

- Test files:
  - backend: `apps/ocr/tests/test_parser.py`, `test_pipeline.py`, `test_views.py`; `apps/common/tests/test_supabase_auth.py`; `apps/refills/tests/test_views.py`
  - frontend: `tests/unit/ocrMapping.test.js`, `refill.test.js`, `adherence.test.js`
  - database: `frontend/docs/database/test-milestone3.sql` (run on PostgreSQL 16 against `schema.sql` + `schema-milestone2.sql`)
- What they cover: multi-medicine parsing (list, table, label layouts), handwriting/low-confidence routing and validation of model output (with a mocked model response), API authentication including expired, forged, wrong-audience and algorithm-confusion tokens, refill maths and low-stock alerts, row-level security and function privileges.
- Results: `pytest` 57 passed; `vitest` 13 passed (frontend, existing suite â€” the 36-test suite for the new `lib/` modules written during development was not carried into the final commit and should be re-added); SQL test file passed in full on a scratch PostgreSQL instance. `black`, `isort`, `ruff` all clean on every file touched this milestone.

## CI

The branch's GitHub Actions pipeline failed on the first few pushes; all failures were environment/config issues, not application bugs, and were fixed and verified in a fresh, from-scratch virtual environment before the final push (not just locally, where a long-lived `.venv` was hiding missing packages):
- `manage.py` had a Unix shebang without the executable bit set (ruff `EXE001`) â€” removed the shebang, since it's always run as `python manage.py`.
- `frontend/package-lock.json` had drifted out of sync with `package.json`, which `npm ci` (used by CI) rejects unlike `npm install` â€” regenerated and committed.
- Settings lived in a single `config/settings.py`, but CI expects `DJANGO_SETTINGS_MODULE=config.settings.dev` (a package). Restructured into `config/settings/{__init__.py, base.py, dev.py}`; `manage.py`, `wsgi.py`, `asgi.py` and `pytest.ini` updated to match.
- `requirements/base.txt` was missing `django-cors-headers`, `opencv-python-headless`, `numpy`, and `PyJWT[crypto]` â€” all had been quietly satisfied by packages already sitting in the long-lived local `.venv`, so `pip install -r requirements` never surfaced the gap locally. Found and fixed by testing in a disposable clean `.venv-citest`.
- Separately (not a CI issue, found while testing the fix above): `apps/ocr/engine/extractor.py` never configured `pytesseract.tesseract_cmd` from the `TESSERACT_CMD` Django setting, unlike the old `services.py`. Locally this was masked by Tesseract being on `PATH` in every terminal used; it surfaced as a live `503 Service Unavailable` on `/api/ocr/scan/` once tested with `PATH` unset. Fixed.

## Blockers and open questions

- **Vision reader has no live API key.** Both Anthropic and OpenAI require a paid account with billing before issuing a usable key; no free credit was available on either. The reader is implemented and unit-tested against a mocked model response, and the app correctly falls back to manual entry without it â€” no incorrect data can be saved. Connecting a real key is a follow-up step, not a blocker for this submission.
- **Two known bugs to investigate next, not yet fixed:** (1) the Dashboard's medicine count does not update immediately after a medicine is deleted on the Medicines page, even after a hard refresh â€” needs a proper look. (2) The 36 unit tests written for the new `frontend/src/lib/{ocrMapping,refill,adherence}.js` modules during development were not carried into what ended up pushed; the modules themselves are pushed and confirmed working live, but their tests should be re-added.
- **A Supabase `service_role` key was pasted into a working chat session while debugging legacy API-key settings.** It was not published anywhere public, but should still be rotated in the Supabase dashboard as a housekeeping step (Project Settings â†’ API â†’ Secret API keys â†’ roll), done separately from this submission.
- Question for mentor: this milestone keeps OCR in Django and refill/adherence logic in Supabase SQL (so it works with row-level security). Is that split acceptable, or should more move to the Django backend?
- Scheduled low-stock alerts need the `pg_cron` extension enabled in Supabase (one-time step, noted in the SQL file); without it, alerts are raised when the Refills page is opened rather than on a schedule.
