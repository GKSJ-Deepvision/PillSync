# Milestone 3 — OCR Recognition & Refill Prediction (Week 5–6)

- **Intern:** Advala Indhu
- **Branch:** `intern/01-advala-indhu`
- **Submitted on:** 24 September 2026

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| OCR medicine recognition operational | ☑ Done (printed/typed, packaging, low-quality and handwriting via Gemini Vision fallback) | `backend/apps/ocr/engine/` (`extractor.py`, `parser.py`, `vision.py`, `pipeline.py`), `POST /api/ocr/scan/` in `backend/apps/ocr/views.py`; Gemini Vision integration tested with real prescription and medicine images |
| Extraction of name, dosage, quantity, frequency, prescription details | ☑ Done | `parser.py` returns one entry per medicine: name, strength, units per dose, doses per day, times of day, duration, quantity, food instruction, plus doctor, date, expiry and refills. Gemini Vision returns structured medicine and prescription metadata. Review screen: `frontend/src/features/ocr/ScanPage.jsx` |
| AI refill prediction system functional | ☑ Done (schedule-based) | `refill_forecast()` in `frontend/docs/database/schema-milestone3.sql`; page `frontend/src/features/refills/RefillsPage.jsx` — forecast, "I bought"/"Recount" actions and stock bar verified live |
| Medication adherence tracking completed | ☑ Done | Dose logging from M2 + `adherence_daily/weekly/by_medication/by_slot()` SQL functions |
| Refill notifications working correctly | ☑ Done | `check_refills()` / `check_refills_all()` write `refill` rows to `notifications` for the patient and accepted caregivers |
| Low-stock alerts | ☑ Done | `is_low_stock` in the forecast; alert throttled to one per medicine per 24 h and re-armed when stock is added |
| Adherence analytics (daily history, percentage, trends) | ☑ Done | `frontend/src/features/adherence/AdherenceReportPage.jsx` — weekly %, previous-week comparison, daily history, 8-week trend, per-medicine, per-time-of-day, perfect-day streak, auto-generated insights, Print / Save as PDF, linked from History page |

## OCR pipeline

1. **Validation** (`pipeline.validate_upload`): JPG/PNG/WebP only, maximum 10 MB, checked with Pillow rather than relying on the file name.

2. **Preprocessing** (`extractor.preprocess`): grayscale conversion, upscale to 1500 px wide, denoising and adaptive thresholding. The Tesseract binary path is read from the `TESSERACT_CMD` Django setting so the OCR engine does not depend on Tesseract being available on the system `PATH`.

3. **OCR**: Tesseract is run with `--oem 3 --psm 6`. Mean word confidence and word count are recorded for determining whether the OCR result is reliable enough for normal parsing.

4. **Parsing** (`parser.py`): OCR text is split into one block per medicine. The parser handles numbered lines, `Tab./Cap.` prefixes, `NAME strength` lines, wrapped medicine lines, list layouts, table layouts and pharmacy labels. Each medicine block is parsed for strength, per-dose units, frequency (`1-0-1`, `OD/BD/TDS/QID`, `HS`, `SOS`, "3X a day", table rows such as `1 Morning, 1 Night`), duration, quantity, food instructions and other prescription details. Duplicate photos of the same label are merged.

5. **Quantity cross-check**: printed quantity is compared with the expected quantity from units × doses × days where sufficient information is available. Differences are flagged rather than silently trusted.

6. **Low confidence / handwriting / cluttered photos**: if the mean OCR confidence is below 65, fewer than 25 readable words are detected, or no medicine is found, the image is routed to the vision reader implemented in `vision.py`.

   The current vision provider is Google Gemini through the Gemini REST API. The provider and model are configurable through environment variables:

   - `PILLSYNC_VISION_PROVIDER=gemini`
   - `PILLSYNC_VISION_MODEL=gemini-3.5-flash`

   The API key is stored in the local ignored `.env` file and is not committed to Git.

   Gemini receives the image and returns structured JSON containing medicine and prescription information. The response is validated and normalized before being passed to the existing OCR pipeline. The vision reader was tested with printed prescriptions, medicine packaging, low-quality medicine images, combination medicines and handwritten prescriptions.

   Vision results with uncertain or incomplete information are marked for review rather than being silently saved.

7. **Human confirmation**: nothing is saved directly from the OCR result. The Scan page displays an editable card for each detected medicine. The user can correct the extracted information and must explicitly confirm the result before saving it.

## Gemini Vision OCR verification

The Gemini Vision integration was tested against several real image types to verify that the fallback works beyond the original Tesseract-only path.

- **Printed multi-medicine prescription:** Gemini correctly identified four medicines and returned structured medicine information for the review screen.

- **Medicine packaging:** an `Acefanac-Mr` medicine package was detected with strength and quantity information. Because the image was not completely clear, the result was marked `needs_review`.

- **Low-quality Sitagliptin image:** Gemini identified `Sitagliptin 50 mg` and the tablet form, while correctly leaving uncertain schedule information for review rather than inventing it.

- **Combination medicine:** a Metformin/Sitagliptin medicine image was processed and the combined strength information was extracted for review.

- **Handwritten prescription:** Gemini detected that the input was handwritten and extracted the available prescription information while marking the result for confirmation.

- **Handwritten Amoxicillin prescription:** Gemini extracted `Amoxicillin 500 mg`, capsule form, `1 capsule 3 times/day`, `7 days` and quantity `21`. The result was shown on the Scan page with a review warning where appropriate.

- **Pharmacy label / known-good printed image:** the existing OCR path continues to support clear printed medicine labels without requiring the vision fallback.

The live Scan page displays the source as AI vision when the vision reader is used, and the extracted fields remain editable before saving.

## OCR safety and review behavior

The OCR system is designed so that uncertain recognition does not automatically become medication data.

- Tesseract confidence is used to determine whether normal OCR parsing is reliable.
- Low-confidence, short or empty OCR results are routed to the vision reader.
- Gemini responses are parsed as structured JSON rather than copied directly into database fields.
- Extracted values are normalized and validated before reaching the review screen.
- Uncertain vision results are marked `needs_review`.
- The user can edit medicine name, strength, dosage, frequency, duration, quantity and other extracted fields.
- Saving requires explicit confirmation from the user.
- API credentials remain outside the repository in the ignored `.env` configuration.
- The previous OCR/Tesseract path remains available as the first-stage recognition method, with Gemini acting as the fallback for difficult images.

## Refill prediction logic

- `remaining = counted stock + purchases − units taken since the count` (a recount starts a new count, so doses are never subtracted twice).

- `daily_use = scheduled daily use` — schedule-based calculation matching the milestone specification. For example, 60 tablets at 2 tablets per day gives 30 days of supply.

- `days_left = remaining ÷ daily_use`; depletion date = today + days_left; recommended refill date = depletion − 5 days; low stock when `days_left ≤ 5`.

The refill calculation was verified in the running application. A medicine with 60 tablets and a scheduled usage of 2 tablets per day produced a 30-day forecast.

## Medication adherence and analytics

Medication adherence continues to use the dose-logging functionality implemented in Milestone 2. Each scheduled dose can be recorded as taken or missed, providing the data used by the adherence calculations.

The Milestone 3 adherence analytics layer provides:

- Daily adherence history.
- Weekly adherence percentage.
- Comparison with the previous week.
- 8-week adherence trend.
- Per-medicine adherence breakdown.
- Per-time-of-day / slot breakdown.
- Perfect-day streak calculation.
- Auto-generated adherence insights.
- Print / Save as PDF functionality.
- Navigation from the History page to the detailed adherence report.

The database functions used for the calculations are:

- `adherence_daily()`
- `adherence_weekly()`
- `adherence_by_medication()`
- `adherence_by_slot()`

The frontend implementation is in `frontend/src/features/adherence/AdherenceReportPage.jsx`.

The adherence report was verified live in the browser. Its totals were cross-checked against the existing History page's 30-day adherence data to ensure the new analytics view was using the same underlying dose records.

## Live verification

The OCR, refill and adherence functionality was exercised in the running application using the React frontend and Django backend rather than relying only on automated tests.

- **Scan** (`/scan`): uploaded real prescription and medicine images. The OCR flow returned medicine cards with extracted fields, including strength, dosage, duration, food instruction and other available prescription details. Gemini Vision was used for low-confidence and handwritten cases. The extracted fields remained editable and could be reviewed before saving.

- **Refills** (`/refills`): a medicine with a stock count showed the calculated forecast, remaining stock, depletion date and reorder date. The "I bought" and "Recount now" actions were also verified.

- **Weekly adherence report** (`/adherence-report`, linked from the History page): showed this week's adherence percentage, comparison with the previous week, perfect-day streak, daily adherence history/bar chart, 8-week trend, per-medicine breakdown, per-time-of-day breakdown, auto-generated insight text and the Print / Save as PDF action. The reported numbers were cross-checked against the existing History page's 30-day adherence data.

## A real-world OCR limitation found and documented

A photo of an actual Sitagliptin 50 mg blister strip was tested. The image was a small 447×447 px foil package with glare. Tesseract confidence was approximately 23.9%, well below the 65% fallback threshold.

Several preprocessing approaches were tested, including contrast enhancement and sharpening, denoising with adaptive thresholding, and cropping around the highest-confidence text region. These did not produce a sufficiently reliable Tesseract result.

The Gemini Vision fallback was able to identify the medicine and strength from the difficult image, but incomplete dosage or schedule information was intentionally left for user review. This demonstrates the intended behavior: the application should not guess medication information when the image does not provide enough reliable evidence.

## Tests

- **Backend OCR tests:**
  - `apps/ocr/tests/test_parser.py`
  - `apps/ocr/tests/test_pipeline.py`
  - `apps/ocr/tests/test_views.py`

- **Other backend tests:**
  - `apps/common/tests/test_supabase_auth.py`
  - `apps/refills/tests/test_views.py`

- **Frontend tests:**
  - `tests/unit/ocrMapping.test.js`
  - `refill.test.js`
  - `adherence.test.js`

- **Database tests:**
  - `frontend/docs/database/test-milestone3.sql`

### Test results

- `pytest apps/ocr -q` → **32 passed**
- `python manage.py test apps.ocr` → **8 passed**
- `ruff check .` → **passed**
- `black --check apps/ocr/engine/vision.py` → **passed**
- `isort --check-only apps/ocr/engine/vision.py` → **passed**
- Final GitHub Actions CI → **successful**
- Backend line coverage in CI → **90.1%**

The OCR test suite covers parsing, pipeline behavior, API views and low-confidence/vision routing. Gemini responses are validated through mocked model-response tests so the application behavior can be tested without making external API calls during the automated test suite.

## CI

The branch's GitHub Actions pipeline was run through the final implementation and formatting fixes.

The final CI run completed successfully and verified the repository build and test workflow, including backend, frontend, Docker/repository checks and secret scanning.

The following issues were identified and resolved during development:

- Ruff import-order validation in `vision.py` was fixed using the project's formatting/import tooling.
- Backend and frontend dependencies were verified against the CI environment.
- OCR dependencies, including Tesseract integration, were verified through the application tests.
- The Tesseract executable is now read from the Django `TESSERACT_CMD` setting rather than relying only on the local `PATH`.
- Gemini configuration is kept in the local ignored `.env` file so the API key is not committed to the repository.
- The final GitHub Actions run completed successfully after the formatting fix.

Final relevant commit:

`fb171df` — `fix: format Gemini vision OCR`

The earlier Gemini integration was committed as:

`adb73ac` — `feat: integrate Gemini vision OCR`

The final CI verification reported:

- Repository/file hygiene: successful
- Secret scan: no credentials detected
- Backend checks: successful
- Frontend checks: successful
- Docker checks: successful
- Backend line coverage: 90.1%
- Overall GitHub Actions result: **Success**

## Blockers and open questions

- **Gemini Vision integration is now connected and live-tested.** The previous blocker of having no usable vision API key was resolved by integrating Gemini through the configurable vision provider in `vision.py`.

- The Gemini API key is intentionally stored outside Git in the ignored `.env` configuration. It must not be committed to the repository.

- Some real-world images, particularly small reflective blister strips or unclear handwriting, can still produce incomplete information. The application handles these cases through `needs_review` and editable confirmation rather than automatically saving uncertain medication data.

- The existing Tesseract OCR path remains useful for clear printed images, while Gemini Vision provides a fallback for difficult, handwritten and low-confidence images.