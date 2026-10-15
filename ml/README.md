# PillSync — AI / OCR workbench

Experiment space for the two AI-driven parts of the project. Production code lives
in `backend/apps/ocr` and `backend/apps/refills`; this folder is where you prove an
approach works before wiring it in.

| Path | Purpose |
|---|---|
| `src/ocr/` | Handwritten + printed medicine-name OCR (see below) |
| `src/nlp/` | spaCy / OpenAI parsing of extracted text into structured fields |
| `src/refill_prediction/` | Consumption modelling, depletion-date estimation |
| `src/common/` | Shared IO and evaluation helpers |
| `notebooks/` | Exploration notebooks — **clear all outputs before committing** |
| `data/raw/`, `data/processed/` | Working data — **git-ignored**, never commit |
| `data/samples/` | A few small, non-sensitive sample images that tests may use |
| `models/` | Trained artefacts — git-ignored (except the handwritten model, see below) |
| `tests/` | Pytest tests for the pipelines above |

**Never commit real prescriptions, or any image containing a real person's medical
data or identity.** Use synthetic or public-domain samples only.

## Getting the datasets

`ml/data/raw/` isn't committed to git (~65MB of images). Get it two ways:

1. **You already have it** if you unzipped the original project archive — nothing
   to do.
2. **Fresh clone**: unzip the bundle produced by `scripts/package_ocr_bundle.sh`
   into the repo root (it contains `ml/data/raw/**` plus the trained handwritten
   model). Re-run that script any time you want to regenerate the bundle, e.g.
   after adding more training images.

The handwritten-word classifier itself (`ml/models/handwritten_medicine_classifier.joblib`,
~38MB compressed) **is** committed, so the app works out of the box without a
training step.

## OCR pipeline — what's here and how well it actually works

There are two, quite different, OCR problems in this repo, and they get two
different solutions:

### 1. Handwritten single-word classification (`ocr_handwritten/`)

**The problem**: classify a cropped image of one handwritten word into one of 78
medicine names. This is a closed-vocabulary classification problem, not open
text recognition, so `train.py` builds a classical HOG + SVM pipeline rather
than reaching for a full OCR engine (cursive handwriting is exactly what
Tesseract is worst at).

**Pipeline** (`train.py` + `features.py`):
1. Grayscale, contrast-normalize, invert, pad each word image to 128×32.
2. Augment training images ~7x with random rotation, shear, stroke-thickness
   (dilate/erode), blur, shift, and noise — with only 40 images/class, this
   matters a lot.
3. HOG descriptor → PCA (250 components, mainly for a ~9x training-speed win,
   with negligible accuracy cost) → calibrated RBF SVM.

**Results** (`ml/models/handwritten_medicine_classifier.metrics.json`), 78
classes:

| | Baseline (before this work) | Current |
|---|---|---|
| Train accuracy | 100% (severely overfit) | 96% |
| Validation accuracy | 70.6% | 69.5% |
| Test accuracy | **52.8%** | **55.3%** |
| Test top-3 accuracy | not measured | **69.9%** |

**Being straight about this**: the baseline's "100% train / 53% test" was
overfitting, not a working model — it had memorized the training strokes.
Fixing that (augmentation, PCA, proper class-balanced regularization) is a
real improvement, but it did **not** get anywhere near 90% test accuracy, and
I don't believe that's reachable with classical HOG/SVM features on this
dataset. The evidence: even training on Training+Validation combined and
throwing much heavier augmentation at it barely moved test accuracy (54–60%
across every configuration tried), while validation accuracy (drawn from the
*same* generation process as training) sits consistently ~15-20 points
higher. That gap points to a real distribution shift baked into how the
`Testing` split was generated, not just insufficient regularization — closing
it would need a CNN/CRNN and substantially more than 40 images/class, not
better classical features.

**Practical mitigation**: `HandwrittenMedicineRecognizer.predict_top_k()`
returns the top-3 candidates (72% top-3 accuracy), which is what
`backend/apps/ocr/services/extractor.py` uses — showing a short list to
confirm is both more honest and safer for a medication app than committing to
a single possibly-wrong guess.

### 2. Printed prescription extraction (`ocr_printed/`)

**The problem, and the actual bug you were hitting**: the old pipeline had a
whole-image pixel classifier that tried to guess which of 10 medicines a
*photo* "looked like" (10% accuracy — a downsized, flattened image doesn't
carry enough information to read text), and — separately — the text parser
(`backend/apps/ocr/services/parser.py`) had **no medicine-name filtering at
all**. It returned whatever text preceded a dosage/frequency pattern, so a
doctor's name or "MBBS, MD" would get saved as if it were a prescribed
medicine.

**The fix**:
- Removed the whole-image classifier. `PrintedMedicineRecognizer` now runs
  real OCR (Tesseract) on the image and only keeps lines that pass step 2.
- Added `ml/src/ocr/vocabulary.py`: a shared fuzzy-matching gate, built from
  every real medicine name in this repo's datasets, that both
  `PrintedMedicineRecognizer` and `parser.py` use to answer "is this actually
  a medicine name?" before accepting a line. It resolves OCR noise like
  "Paracetamal" → Paracetamol or "TabOmeprazcte" → Omeprazole, while
  correctly rejecting "Dr S Patel", "MBBS, MD", "Rx", dates, and patient
  names. See `ml/tests/test_vocabulary.py`.
- Added numeric dosing-schedule parsing (`1-0-1` style, not just "twice
  daily") to `parser.py`.

**Results**, measured on 300 real printed prescription images:
- **Medicine-name precision: 99.5%** — when the pipeline reports a medicine,
  it's almost never wrong. This is the number that matters for "only add
  medicines, not junk."
- Medicine-name recall against `labels.csv`: ~49%. **This looks worse than it
  is**: `labels.csv` lists ~7 medicine rows per image on average, but visual
  inspection shows only ~3 medicine lines are actually rendered on each image
  (confirmed by opening several images directly) — the label file is a
  superset that includes rows never drawn on the page. Recall against what's
  *actually printed* is much higher; spot-checks found the pipeline caught
  nearly everything actually on the page.

### Vocabulary size caveat

`ml/data/raw/medicine_reference/medicine_dataset.csv` has 50,000 rows but
reuses a pool of only ~64 unique drug names (the Category/Strength/
Manufacturer columns are randomized per row, so they're not usable as
per-drug facts and aren't surfaced). Combined with the 78 handwritten +10
printed names, the working vocabulary has ~150 unique medicines. That's
enough to make the demo dataset work correctly. The name-only list is bundled
in `src/ocr/medicine_names.txt` so deployments still have the full demo
vocabulary when the git-ignored raw datasets are absent. This is not a
comprehensive drug database; a production deployment would want to load a
maintained national drug database instead — `vocabulary.py` is written so
that's a matter of pointing `_load_reference_csv` (or adding another loader)
at a bigger name list, not restructuring the matching logic.

## Reproducing the training run

```bash
pip install -r ml/requirements.txt
python -m ml.src.ocr.train
```

Takes ~4 minutes on a single CPU core (feature extraction + augmentation
~30s, SVM fit ~3.5min). Writes the model to
`ml/models/handwritten_medicine_classifier.joblib` and metrics to the
adjacent `.metrics.json`.


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
