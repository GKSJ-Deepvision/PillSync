# ocr — Module 3: Medicine Upload & OCR Recognition

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
