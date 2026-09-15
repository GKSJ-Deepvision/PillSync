"""Train guarded Milestone 3 adherence models from PillSync application events.

The application database is the label source. Synthea is intentionally not used
as a supervised label source because it has no taken/missed dose outcomes.
"""

import argparse
import json
import os
import sys
from pathlib import Path

import joblib
import numpy as np
from django import setup
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

BASE_DIR = Path(__file__).resolve().parents[1]
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, str(BASE_DIR))
setup()

from core.models import AdherenceRecord  # noqa: E402

FEATURE_COLUMNS = ['hour', 'weekday', 'medication_compliance', 'remaining_ratio', 'patient_missed_count']


def build_training_rows():
    records = AdherenceRecord.objects.select_related('patient', 'medication').order_by('scheduled_for')
    missed_by_patient = {}
    rows = []
    for record in records:
        patient_id = record.patient_id
        previous_missed = missed_by_patient.get(patient_id, 0)
        medication = record.medication
        remaining_ratio = (medication.remaining_quantity / medication.quantity) if medication and medication.quantity else 0
        rows.append({
            'hour': record.scheduled_for.hour,
            'weekday': record.scheduled_for.weekday(),
            'medication_compliance': medication.compliance if medication else 0,
            'remaining_ratio': remaining_ratio,
            'patient_missed_count': previous_missed,
            'label': int(record.status == 'Missed'),
        })
        if record.status == 'Missed':
            missed_by_patient[patient_id] = previous_missed + 1
    return rows


def train(output_dir):
    rows = build_training_rows()
    labels = np.array([row.pop('label') for row in rows], dtype=int)
    result = {
        'training_rows': len(rows),
        'positive_labels': int(labels.sum()) if len(labels) else 0,
        'model_trained': False,
        'limitations': [],
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / 'training_data.json').write_text(json.dumps(rows, indent=2), encoding='utf-8')

    if len(rows) < 30:
        result['limitations'].append('At least 30 labeled dose events are required before training.')
    if len(set(labels.tolist())) < 2:
        result['limitations'].append('Both Taken and Missed labels are required.')
    if result['limitations']:
        (output_dir / 'metrics.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
        return result

    features = [{column: row[column] for column in FEATURE_COLUMNS} for row in rows]
    numeric = ['hour', 'weekday', 'medication_compliance', 'remaining_ratio', 'patient_missed_count']
    preprocessor = ColumnTransformer([('numeric', Pipeline([('impute', SimpleImputer(strategy='median')), ('scale', StandardScaler())]), numeric)])
    model = Pipeline([('preprocessor', preprocessor), ('classifier', LogisticRegression(max_iter=1000, class_weight='balanced'))])
    evaluation = 'training_set_diagnostic'
    if len(rows) >= 50 and min(np.bincount(labels)) >= 2:
        train_features, test_features, train_labels, test_labels = train_test_split(
            features, labels, test_size=0.2, random_state=42, stratify=labels,
        )
        model.fit(train_features, train_labels)
        predictions = model.predict(test_features)
        evaluation = 'stratified_holdout'
    else:
        model.fit(features, labels)
        predictions = model.predict(features)
    precision, recall, f1, _ = precision_recall_fscore_support(labels, predictions, average='binary', zero_division=0)
    result.update({
        'model_trained': True,
        'accuracy': accuracy_score(labels, predictions),
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'evaluation': evaluation,
        'classification_report': classification_report(labels, predictions, zero_division=0),
    })
    joblib.dump({'model': model, 'features': FEATURE_COLUMNS}, output_dir / 'missed_dose_risk.joblib')
    (output_dir / 'metrics.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-dir', type=Path, default=Path(__file__).resolve().parent / 'artifacts')
    args = parser.parse_args()
    print(json.dumps(train(args.output_dir), indent=2))


if __name__ == '__main__':
    main()
