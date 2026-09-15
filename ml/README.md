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

## Refill prediction (`src/refill_prediction/`)

Predicts, per medicine, how many days of stock a patient has left — and does
it by learning the patient's *actual* adherence pattern rather than just
assuming every dose gets taken as prescribed.

| File | Purpose |
|---|---|
| `features.py` | Turns `medications` + `medication_schedules` + `dose_logs` rows into the model's feature vector. Shared by training and serving so they never drift apart. |
| `synthetic_data.py` | Simulates a realistic population of adherence patterns (see its docstring) to train on until real `dose_logs` history has accumulated in production. |
| `train.py` | Benchmarks Linear Regression / Random Forest / Gradient Boosting by cross-validated MAE, keeps the winner, writes `models/refill_predictor.joblib` + `models/refill_predictor_metadata.json`. |
| `model.py` | `RefillPredictor` — the inference-time class the FastAPI service imports. Combines the ML adherence estimate with exact dosing-schedule arithmetic; falls back to "assume prescribed dose" if no model artifact exists yet. |

Retrain with:

```bash
pip install -r ml/requirements.txt
python -m ml.src.refill_prediction.train
```

Run its tests with `pytest ml/tests`.
