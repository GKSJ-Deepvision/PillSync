# PillSync Milestone 2 — Adherence Analysis / Risk Prototype

## Academic Disclaimer

> **This is an academic ML prototype built on synthetic patient data (Synthea) with synthetically generated adherence events. The predictions are NOT medical diagnoses or clinical recommendations. This system is not clinically validated and must not be used for real medical decision-making.**

---

## 1. Project Objective

Implement a complete ML pipeline for PillSync Milestone 2 that:
- Parses Synthea CCDA XML synthetic patient data
- Generates realistic synthetic medication adherence events
- Engineers 21-day historical adherence features
- Creates a 7-day future adherence target
- Trains a Random Forest classifier to predict future adherence risk
- Exposes predictions via a Django REST API
- Integrates results into the existing Adherence.jsx page

---

## 2. Synthea Dataset

| Property | Value |
|---|---|
| Location | `C:\Users\Venkateswararao\Downloads\synthea_sample_data_ccda_latest` |
| Format | CCDA XML (one `.xml` file per patient) |
| Patients | 108 |
| Purpose | ML training pipeline source ONLY — not loaded into PillSync DB |

Synthea is a synthetic patient generator that produces clinically realistic (but entirely fictional) patient records in HL7 CCDA format.

---

## 3. CCDA XML Format

Each XML file uses the HL7 v3 namespace (`urn:hl7-org:v3`) and follows the Consolidated Clinical Document Architecture (CCDA) standard:

```
ClinicalDocument
  └── recordTarget
        └── patientRole
              └── patient
                    ├── name (given, family)
                    ├── administrativeGenderCode (@code: M/F/UN)
                    └── birthTime (@value: YYYYMMDD)
  └── component
        └── structuredBody
              └── component
                    └── section (code=10160-0: Medications)
                          └── entry
                                └── substanceAdministration
                                      ├── effectiveTime (low/high)
                                      └── consumable
                                            └── manufacturedProduct
                                                  └── manufacturedMaterial
                                                        └── code (@displayName)
```

---

## 4. XML Parsing Process (`parse_synthea_ccda.py`)

- Reads all `.xml` files using Python's built-in `xml.etree.ElementTree`
- Handles missing sections and malformed XML without crashing
- Uses Clark notation for the HL7 namespace: `{urn:hl7-org:v3}tagname`
- Extracts: `patient_id`, `birthdate`, `age`, `gender`, medication names, start/end dates, status
- Outputs: `patients_raw.csv` and `medication_counts.csv`

**Results: 108/108 patients parsed, 3,850 medication records, 148 unique medications**

---

## 5. Why Synthetic Adherence Events Are Required

Synthea CCDA files contain medication **prescriptions** (what was prescribed) but NOT medication **adherence behavior** (whether the patient actually took each dose). Adherence events — Taken, Missed, Snoozed — do not exist in CCDA data.

Therefore, realistic synthetic adherence events are generated using a seeded random process that models:
- A patient's base adherence tendency (drawn from a Beta distribution)
- Age-related and medication-burden-related adherence penalties
- Temporal consistency via streak effects (consecutive misses increase future miss probability)

---

## 6. Synthetic Adherence Event Generation (`build_adherence_dataset.py`)

### Time Windows
```
Days 1-21  → Historical period (used for feature engineering)
Days 22-28 → Future period (used ONLY for target label creation)
```

### Per-patient Adherence Profile
Each patient receives a seeded profile:
```python
base_take_prob   = Beta(alpha, beta) adjusted for age & medication burden
base_snooze_prob = partial non-compliance factor
streak_penalty   = consecutive-miss effect on future probability
```

### Event Generation per Dose
```python
r = random()
if r < take_prob:               → 'Taken'
elif r < take_prob + snooze_p:  → 'Snoozed'
else:                           → 'Missed'
```

Consecutive missed doses increase the miss probability on subsequent doses (temporal consistency).

---

## 7. Historical Feature Engineering (21-day window)

| Feature | Description |
|---|---|
| `age` | Patient age in years |
| `gender_encoded` | M=0, F=1, U=2 |
| `num_medications` | Number of active medications |
| `doses_per_day` | Total daily doses across all medications |
| `previous_21day_taken` | Taken dose count in 21-day window |
| `previous_21day_missed` | Missed dose count in 21-day window |
| `previous_21day_snoozed` | Snoozed dose count in 21-day window |
| `previous_7day_adherence` | Taken / Total × 100 for last 7 days |
| `previous_14day_adherence` | Taken / Total × 100 for last 14 days |
| `previous_21day_adherence` | Taken / Total × 100 for full 21 days |
| `miss_rate` | Missed / Total × 100 for 21 days |
| `snooze_rate` | Snoozed / Total × 100 for 21 days |
| `consecutive_missed` | Trailing run of missed doses at end of history |

---

## 8. Future 7-day Target Creation

```
future_7day_adherence = future_taken / future_total × 100

future_7day_risk:
  ≥ 80%  →  LOW     (good predicted compliance)
  ≥ 50%  →  MEDIUM  (moderate predicted compliance)
  < 50%  →  HIGH    (poor predicted compliance)
```

> **These thresholds are heuristic values for this academic prototype only.** They are NOT WHO standards, universal clinical cutoffs, or medically validated thresholds.

---

## 9. Target Leakage Prevention

The model was built with explicit leakage prevention:

1. **Separate windows**: features use only days 1-21; target uses only days 22-28
2. **Explicit feature list**: `FEATURE_COLUMNS` in `train_adherence_risk.py` names only historical features
3. **Leak guard**: `assert_no_leakage()` raises `ValueError` if any future column appears in features
4. **Independent generation**: future events are generated from the same underlying tendency but as independent draws — the model must learn patterns, not reproduce a rule

---

## 10. Random Forest Model

| Parameter | Value |
|---|---|
| Algorithm | `RandomForestClassifier` (scikit-learn) |
| `n_estimators` | 100 |
| `class_weight` | `'balanced'` |
| `random_state` | 42 |
| Train/test split | Stratified 80/20 |
| Target | `future_7day_risk` (LOW / MEDIUM / HIGH) |

---

## 11. Actual Evaluation Results (from trained model)

| Metric | Value |
|---|---|
| Accuracy | **0.5909** |
| Precision (weighted) | **0.5861** |
| Recall (weighted) | **0.5909** |
| F1-score (weighted) | **0.5828** |

### Classification Report
```
              precision    recall  f1-score   support
        HIGH       0.64      0.78      0.70         9
         LOW       0.67      0.50      0.57         4
      MEDIUM       0.50      0.44      0.47         9
    accuracy                           0.59        22
   macro avg       0.60      0.57      0.58        22
weighted avg       0.59      0.59      0.58        22
```

### Confusion Matrix (labels: HIGH, LOW, MEDIUM)
```
[[7, 0, 2],
 [0, 2, 2],
 [4, 1, 4]]
```

### Top Feature Importances
| Feature | Importance |
|---|---|
| previous_21day_adherence | 17.7% |
| previous_21day_taken | 13.5% |
| previous_21day_missed | 11.6% |
| miss_rate | 10.3% |
| previous_7day_adherence | 9.3% |

> **Note**: ~59% accuracy on a 3-class problem with 108 synthetic patients is expected. A random baseline would achieve ~33%. The model demonstrates genuine predictive learning from historical adherence patterns.

---

## 12. Model Artifacts

| File | Path |
|---|---|
| Trained model | `backend/ml/artifacts/adherence_risk_rf.joblib` |
| Evaluation metrics | `backend/ml/artifacts/adherence_risk_metrics.json` |
| Training dataset | `backend/ml/data/synthea/pillsync_adherence_dataset.csv` |
| Parsed patients | `backend/ml/data/synthea/patients_raw.csv` |
| Medication records | `backend/ml/data/synthea/medication_counts.csv` |

---

## 13. Django API

**Endpoint**: `GET /api/patient/adherence/risk/`

**Authentication**: JWT Bearer token (existing PillSync auth)

**Input**: Built automatically from the authenticated patient's `AdherenceRecord` history (21-day window)

**Response (prediction available)**:
```json
{
  "available": true,
  "risk_level": "LOW",
  "adherence_score": 82.5,
  "taken_doses": 35,
  "missed_doses": 4,
  "snoozed_doses": 3,
  "miss_rate": 9.5,
  "snooze_rate": 7.1,
  "top_features": [
    {"feature": "previous_21day_adherence", "importance": 0.1772},
    {"feature": "miss_rate", "importance": 0.1030}
  ],
  "confidence": {"HIGH": 0.05, "LOW": 0.82, "MEDIUM": 0.13},
  "model": "Random Forest (trained on Synthea synthetic data)",
  "disclaimer": "Academic prototype — not a medical diagnosis."
}
```

**Response (insufficient history)**:
```json
{
  "available": false,
  "message": "Insufficient adherence history for ML risk prediction. At least 3 recorded doses are required."
}
```

---

## 14. Frontend Integration

**File modified**: `src/pages/patient/Adherence.jsx`

The existing Adherence page was enhanced with a new **"ML Risk Prediction"** section below all existing cards. Added:
- Risk level badge (LOW / MEDIUM / HIGH) with colour coding
- Recent adherence score (21-day history)
- Taken / Missed / Snoozed dose counts
- Miss rate and snooze rate progress bars
- Model confidence per class
- Feature importance chart (from actual RF model)
- Model source indicator with academic disclaimer

---

## 15. Limitations

1. **Synthetic data**: Synthea generates realistic but entirely fictional patients
2. **Synthetic adherence**: Dose events are synthetically generated — not from real patient behavior
3. **Dataset size**: 108 source patients → small train/test split
4. **Not clinically validated**: No validation against real-world adherence data
5. **Heuristic thresholds**: LOW/MEDIUM/HIGH boundaries are prototype-specific
6. **Not representative**: Does not represent any real-world population
7. **Not for clinical use**: Must not be used as a medical diagnostic tool

---

## 16. Pipeline Commands

```powershell
# From the backend directory:
cd "C:\Users\Venkateswararao\Downloads\Pillsync\pillsync-frontend\backend"

# Step 1: Parse Synthea CCDA XML files
$env:PYTHONUTF8=1; python ml/parse_synthea_ccda.py

# Step 2: Generate synthetic adherence dataset
$env:PYTHONUTF8=1; python ml/build_adherence_dataset.py

# Step 3: Train Random Forest model
$env:PYTHONUTF8=1; python ml/train_adherence_risk.py

# Step 4: Start Django server
python manage.py runserver

# Frontend (separate terminal, from project root):
cd "C:\Users\Venkateswararao\Downloads\Pillsync\pillsync-frontend"
npm run dev
```
