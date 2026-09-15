"""PillSync ML prediction module.

Contains two independent prediction systems:

1. predict_missed_dose_risk()
   - Model : Logistic Regression
   - Trained from: PillSync application AdherenceRecord events
   - Purpose: Predict whether the NEXT individual dose will be missed

2. predict_adherence_risk()
   - Model : Random Forest Classifier
   - Trained from: Synthea CCDA synthetic patient data + synthetic adherence events
   - Purpose: Predict future 7-day adherence risk (LOW / MEDIUM / HIGH)
     based on the previous 21-day historical adherence behavior

ACADEMIC DISCLAIMER:
   predict_adherence_risk() is an academic prototype trained on synthetic data.
   It is NOT a clinically validated model and predictions are not medical diagnoses.
"""

import json
from pathlib import Path

import joblib

# ---------------------------------------------------------------------------
# Artefact paths
# ---------------------------------------------------------------------------
_ARTIFACTS_DIR = Path(__file__).resolve().parent / 'artifacts'
_LOGISTIC_ARTIFACT = _ARTIFACTS_DIR / 'missed_dose_risk.joblib'
_RF_ARTIFACT = _ARTIFACTS_DIR / 'adherence_risk_rf.joblib'
_RF_METRICS = _ARTIFACTS_DIR / 'adherence_risk_metrics.json'

# ---------------------------------------------------------------------------
# Feature columns for adherence risk model (must match train_adherence_risk.py)
# ---------------------------------------------------------------------------
_RF_FEATURE_COLUMNS = [
    'age',
    'gender_encoded',
    'num_medications',
    'doses_per_day',
    'previous_7day_adherence',
    'previous_14day_adherence',
    'previous_21day_adherence',
    'previous_21day_taken',
    'previous_21day_missed',
    'previous_21day_snoozed',
    'miss_rate',
    'snooze_rate',
    'consecutive_missed',
]

_GENDER_ENCODING = {'M': 0, 'F': 1, 'U': 2}


# ---------------------------------------------------------------------------
# 1. Existing: Logistic Regression missed-dose risk (UNCHANGED)
# ---------------------------------------------------------------------------

def predict_missed_dose_risk(*, hour, weekday, medication_compliance, remaining_ratio, patient_missed_count):
    """Predict single missed-dose risk using the Logistic Regression model.

    Returns a dict with 'available', 'probability', and 'model' keys.
    This function is unchanged from Milestone 3.
    """
    if not _LOGISTIC_ARTIFACT.exists():
        return {'available': False, 'reason': 'A trained model is not available; using the rule-based baseline.'}
    artifact = joblib.load(_LOGISTIC_ARTIFACT)
    probability = float(artifact['model'].predict_proba([{
        'hour': hour,
        'weekday': weekday,
        'medication_compliance': medication_compliance,
        'remaining_ratio': remaining_ratio,
        'patient_missed_count': patient_missed_count,
    }])[0][1])
    return {'available': True, 'probability': round(probability, 4), 'model': 'logistic_regression'}


# ---------------------------------------------------------------------------
# 2. New: Random Forest adherence risk prediction
# ---------------------------------------------------------------------------

def predict_adherence_risk(features_dict: dict) -> dict:
    """Predict future 7-day adherence risk using the Random Forest model.

    The model was trained on 21-day historical adherence features from
    Synthea synthetic patient data. It predicts future adherence risk as
    LOW / MEDIUM / HIGH.

    Parameters
    ----------
    features_dict : dict
        Must contain the following historical/demographic keys:
          - age                        (int)
          - gender                     (str: 'M', 'F', or 'U')
          - num_medications            (int)
          - doses_per_day              (int)
          - previous_7day_adherence    (float, 0-100)
          - previous_14day_adherence   (float, 0-100)
          - previous_21day_adherence   (float, 0-100)
          - previous_21day_taken       (int)
          - previous_21day_missed      (int)
          - previous_21day_snoozed     (int)
          - miss_rate                  (float, 0-100)
          - snooze_rate                (float, 0-100)
          - consecutive_missed         (int)

    Returns
    -------
    dict with keys:
      available         : bool
      risk_level        : 'LOW' | 'MEDIUM' | 'HIGH'
      adherence_score   : recent 21-day adherence percentage (historical)
      taken_doses       : previous_21day_taken
      missed_doses      : previous_21day_missed
      snoozed_doses     : previous_21day_snoozed
      miss_rate         : miss rate percentage
      snooze_rate       : snooze rate percentage
      top_features      : list of {feature, importance} dicts
      model             : model description string
      disclaimer        : academic disclaimer text

    On error or missing model:
      available  : False
      message    : reason string
    """
    if not _RF_ARTIFACT.exists():
        return {
            'available': False,
            'message': (
                'Adherence risk model not found. '
                'Run backend/ml/train_adherence_risk.py to train the model.'
            ),
        }

    # Validate required features
    missing = [k for k in _RF_FEATURE_COLUMNS if k not in features_dict and k != 'gender_encoded']
    if missing and 'gender' not in features_dict:
        return {
            'available': False,
            'message': f'Missing required features: {missing}',
        }

    try:
        artifact = joblib.load(_RF_ARTIFACT)
        model = artifact['model']
        feature_cols = artifact.get('feature_columns', _RF_FEATURE_COLUMNS)
        gender_encoding = artifact.get('gender_encoding', _GENDER_ENCODING)

        # Build feature row in the correct order
        gender_raw = str(features_dict.get('gender', 'U')).upper()
        gender_encoded = gender_encoding.get(gender_raw, 2)

        row = {}
        for col in feature_cols:
            if col == 'gender_encoded':
                row[col] = gender_encoded
            else:
                row[col] = float(features_dict.get(col, 0))

        import pandas as pd

        X = pd.DataFrame([row], columns=feature_cols)
        risk_level = str(model.predict(X)[0])

        # Load top features from saved metrics
        top_features = []
        if _RF_METRICS.exists():
            try:
                metrics = json.loads(_RF_METRICS.read_text(encoding='utf-8'))
                top_features = metrics.get('top_features', [])[:5]
            except Exception:
                pass

        # Compute confidence probabilities
        probas = model.predict_proba(X)[0]
        classes = model.classes_.tolist()
        confidence = dict(zip(classes, [round(float(p), 4) for p in probas]))

        return {
            'available': True,
            'risk_level': risk_level,
            'adherence_score': round(float(features_dict.get('previous_21day_adherence', 0)), 2),
            'taken_doses': int(features_dict.get('previous_21day_taken', 0)),
            'missed_doses': int(features_dict.get('previous_21day_missed', 0)),
            'snoozed_doses': int(features_dict.get('previous_21day_snoozed', 0)),
            'miss_rate': round(float(features_dict.get('miss_rate', 0)), 2),
            'snooze_rate': round(float(features_dict.get('snooze_rate', 0)), 2),
            'top_features': top_features,
            'confidence': confidence,
            'model': 'Random Forest (trained on Synthea synthetic data)',
            'disclaimer': (
                'Academic prototype — not a medical diagnosis. '
                'Trained on synthetic Synthea patient data with synthetic adherence events.'
            ),
        }

    except Exception as exc:
        return {
            'available': False,
            'message': f'Prediction error: {exc}',
        }
