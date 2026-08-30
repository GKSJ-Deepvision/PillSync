# PillSync — AI / OCR workbench

Experiment space for the two AI-driven parts of the project. Production code lives
in `backend/apps/ocr` and `backend/apps/refills`; this folder is where you prove an
approach works before wiring it in.

| Path | Purpose |
|---|---|
| `src/ocr/` | Tesseract preprocessing, image cleanup, text extraction |
| `src/nlp/` | spaCy / OpenAI parsing of extracted text into structured fields |
| `src/refill_prediction/` | Consumption modelling, depletion-date estimation |
| `src/common/` | Shared IO and evaluation helpers |
| `notebooks/` | Exploration notebooks — **clear all outputs before committing** |
| `data/raw/`, `data/processed/` | Working data — **git-ignored**, never commit |
| `data/samples/` | A few small, non-sensitive sample images that tests may use |
| `models/` | Trained artefacts — git-ignored; store large files elsewhere and link them |
| `tests/` | Pytest tests for the pipelines above |

**Never commit real prescriptions, or any image containing a real person's medical
data or identity.** Use synthetic or public-domain samples only.
