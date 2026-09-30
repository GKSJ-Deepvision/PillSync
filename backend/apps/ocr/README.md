# ocr — Module 3: Medicine Upload & OCR Recognition

## Reference implementation (on `main`)

Photo or pasted text in, reviewed medicines out. Design and reasoning:
[`docs/architecture/ocr-and-refills.md`](../../../docs/architecture/ocr-and-refills.md).
Measured accuracy: [`docs/reports/ocr-evaluation.md`](../../../docs/reports/ocr-evaluation.md).

| File | Job |
|---|---|
| `models.py` | `OCRJob` (a scan) and `ExtractedMedicine` (one line, for the patient to review) |
| `services/preprocess.py` | Pillow-only image cleanup |
| `services/engines.py` | The engine seam: `TesseractEngine` today; a hosted engine can replace it via `OCR_ENGINE` |
| `services/parser.py` | Pure-Python, rule-based parser (no Django) |
| `services/matcher.py` | Fuzzy catalogue matching; thresholds and the low-confidence rule live here |
| `services/pipeline.py` | `process_job`, `reparse`, `confirm_job`; never raises, failures become a `FAILED` job |
| `views.py`, `serializers.py` | Upload validation, review, confirm; the image is served only through an authenticated endpoint |
| `tasks.py` | Optional async reading; nightly purge of unconfirmed scans |

Rules that must not be weakened: nothing is saved until the patient confirms; a doubtful match is
*suggested*, never applied; a poorly read page downgrades every match to a suggestion.
Run the tests with `pytest apps/ocr`; the Tesseract tests need the binary (they run in the backend image).

---

**Implement here**
- Medicine image and prescription upload endpoints (with file type/size validation)
- Tesseract OCR pipeline + spaCy / OpenAI post-processing
- Extraction of: medicine name, dosage, quantity, frequency, prescription details
- Confidence scoring and a manual-correction path when extraction is uncertain
- Manual entry fallback

Heavy experimentation belongs in [`ml/src/ocr`](../../../ml/src/ocr); this app is the
production-facing API wrapper around it.

**Expected files:** `views.py`, `serializers.py`, `urls.py`, `services/extractor.py`, `services/parser.py`, `tests/`

**Milestone:** 3 (Week 5–6)
