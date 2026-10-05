# Milestone 3 — OCR Recognition & Refill Prediction (Week 5–6)

- **Intern:** Dharmana Rohila
- **Branch:** intern/02-dharmana-rohila
- **Submitted on:** 2026-09-28

## Evaluation criteria

| Criterion | Status | Evidence (file, path or link) |
|---|---|---|
| OCR medicine recognition operational | ☑ Done | [`ml/src/ocr/engine.py`](../../ml/src/ocr/engine.py), [`backend/apps/ocr/views.py`](../../backend/apps/ocr/views.py) |
| Extraction of name, dosage, quantity, frequency, prescription details | ☑ Done | [`ml/src/ocr/extractor.py`](../../ml/src/ocr/extractor.py), [`backend/tests/test_ocr_pipeline.py`](../../backend/tests/test_ocr_pipeline.py) |
| AI refill prediction system functional | ☐ In progress | |
| Medication adherence tracking completed | ☐ In progress | |
| Refill notifications working correctly | ☐ In progress | |
| Low-stock alerts | ☐ In progress | |
| Adherence analytics (daily history, percentage, trends) | ☐ In progress | |

## OCR pipeline

- **Image Preprocessing** ([`ml/src/ocr/preprocessor.py`](../../ml/src/ocr/preprocessor.py)):
  - Validates file type (`JPG`, `JPEG`, `PNG`, `WEBP`) and enforces 10 MB limit.
  - EXIF orientation transpose, resolution optimization (800–2500 px).
  - Grayscale conversion, 1.8x contrast enhancement, median noise reduction, and adaptive thresholding.
  - Original image preserved for live preview and dual-pass fallback.
- **OCR Engine** ([`ml/src/ocr/engine.py`](../../ml/src/ocr/engine.py)):
  - Native Tesseract OCR v5.4.0 integration via `pytesseract`.
  - Multi-tier dynamic path discovery (`settings.TESSERACT_CMD`, env, Windows paths, system PATH).
  - Word-level confidence calculation (`image_to_data`).
  - Dual-pass fallback mechanism if binarized confidence is low.
- **Medicine Information Extraction** ([`ml/src/ocr/extractor.py`](../../ml/src/ocr/extractor.py)):
  - Regex pre-cleaning for merged OCR tokens.
  - Numbered list and medication block segmentation for multi-medicine prescriptions.
  - Curated 1,000+ drug lexicon with Levenshtein edit distance $\le 2$ typo tolerance.
  - Metric dosage extraction (`mg`, `mcg`, `ml`, `iu`, `puff`, `drops`).
  - Total dispense quantity separated from dosage strength.
  - Normalized frequency mapping (`Once daily`, `Twice daily`, `Every 8 hours`, `Night`).
  - Distinct duration extraction (`5 days`, `2 weeks`).
  - Prescription instructions (`After food`, `Before food`, route of administration).
  - Missing field rule: returns `null`, never invents or guesses.

## Accuracy

- **OCR field-level accuracy on sample set**: 96.4% on printed prescription dataset.
- **Sample set used**: Synthetic multi-medicine and single-medicine test prescriptions generated dynamically via PIL Canvas, covering varied dosages, frequencies, and instructions without compromising patient privacy.

## Tests

- **Test file added**: [`backend/tests/test_ocr_pipeline.py`](../../backend/tests/test_ocr_pipeline.py)
- **What they cover**:
  - TEST 1: Single medicine prescription (`Paracetamol 500 mg`)
  - TEST 2: Multi-medicine prescription (3 items: `Amoxicillin`, `Cetirizine`, `Pantoprazole`)
  - TEST 3: Varied dosage formats (`500 mg`, `650mg`, `10 mg`, `5 ml`, `250 mcg`)
  - TEST 4: Clinical frequencies (`Once daily`, `Twice daily`, `Every 8h`, `Night`, `1-0-1`)
  - TEST 5: Duration parsing (`5 days`, `7 days`, `2 weeks`, `1 month`)
  - TEST 6: Food instructions (`After food`, `Before food`, `With food`)
  - TEST 7: Poor-quality / blurred image handling (low confidence, graceful degradation)
  - TEST 8: Blank image / non-prescription image (422 Unprocessable Entity)
  - TEST 9: Unsupported file type validation (400 Bad Request)
  - TEST 10: Missing dosage handling (`null`, no guessing)
  - TEST 11: Missing quantity handling (`null`, no guessing)
  - TEST 12: Missing frequency handling (`null`, no guessing)
  - TEST 13: Handwritten / stylized prescription handling
  - TEST 14: End-to-end API upload and DB save flow
  - TEST 15: OCR health status endpoint
- **Test Results**:
  - `backend.tests.test_ocr_pipeline`: **15 passed** (100% success rate)
  - `authentication`: **17 passed** (zero regressions)
  - Total: **32 passed in 13.55s**

## Blockers and open questions

None. The OCR recognition and information extraction pipeline is fully operational.
