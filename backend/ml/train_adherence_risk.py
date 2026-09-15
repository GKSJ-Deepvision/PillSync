"""Train a Random Forest classifier to predict future 7-day medication adherence risk.

Pipeline:
  1. Load pillsync_adherence_dataset.csv (output of build_adherence_dataset.py)
  2. Select historical features only (no future-period information)
  3. Stratified 80/20 train-test split
  4. Train RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)
  5. Evaluate on held-out test set
  6. Save model → backend/ml/artifacts/adherence_risk_rf.joblib
  7. Save metrics → backend/ml/artifacts/adherence_risk_metrics.json

TARGET LEAKAGE PREVENTION:
  FEATURE_COLUMNS explicitly excludes ALL future-period columns.
  The target is future_7day_risk.

ACADEMIC DISCLAIMER:
  This is a prototype trained on synthetic data. Not for clinical use.
"""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ML_DIR = Path(__file__).resolve().parent
DATA_DIR = ML_DIR / 'data' / 'synthea'
ARTIFACTS_DIR = ML_DIR / 'artifacts'
DATASET_CSV = DATA_DIR / 'pillsync_adherence_dataset.csv'
MODEL_PATH = ARTIFACTS_DIR / 'adherence_risk_rf.joblib'
METRICS_PATH = ARTIFACTS_DIR / 'adherence_risk_metrics.json'

# ---------------------------------------------------------------------------
# Feature columns — ONLY historical / demographic features
# Future-period columns (future_7day_*) are explicitly excluded
# ---------------------------------------------------------------------------
FEATURE_COLUMNS = [
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

TARGET_COLUMN = 'future_7day_risk'

# Future columns that must NEVER appear as features (leak prevention)
FORBIDDEN_FEATURES = {
    'future_7day_taken',
    'future_7day_missed',
    'future_7day_snoozed',
    'future_7day_adherence',
    'future_7day_risk',
}

# Class label order
CLASS_LABELS = ['HIGH', 'LOW', 'MEDIUM']


# ---------------------------------------------------------------------------
# Leak guard
# ---------------------------------------------------------------------------

def assert_no_leakage(feature_cols: list) -> None:
    """Raise ValueError if any future-period feature is accidentally included."""
    leaked = set(feature_cols) & FORBIDDEN_FEATURES
    if leaked:
        raise ValueError(
            f'TARGET LEAKAGE DETECTED: forbidden features in model input: {leaked}'
        )


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def train(dataset_path: Path = DATASET_CSV) -> dict:
    """Load dataset, train Random Forest, evaluate, save artefacts."""

    print('Loading dataset...')
    df = pd.read_csv(dataset_path)
    print(f'  Loaded {len(df)} rows, {len(df.columns)} columns')

    # Verify features exist
    missing_features = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if missing_features:
        raise ValueError(f'Dataset missing required feature columns: {missing_features}')
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f'Dataset missing target column: {TARGET_COLUMN}')

    # Leak guard
    assert_no_leakage(FEATURE_COLUMNS)
    print('  Target leakage check passed.')

    # Prepare X and y
    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET_COLUMN].copy()

    # Fill any remaining NaNs with column medians
    X = X.fillna(X.median(numeric_only=True))

    print(f'\nClass distribution:')
    dist = y.value_counts()
    for label, count in dist.items():
        print(f'  {label}: {count} ({count/len(y)*100:.1f}%)')

    if y.nunique() < 2:
        raise ValueError('Need at least 2 classes to train a classifier.')

    # Stratified split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f'\nTrain size: {len(X_train)}, Test size: {len(X_test)}')

    # Train Random Forest
    print('\nTraining RandomForestClassifier...')
    model = RandomForestClassifier(
        n_estimators=100,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)
    print('  Training complete.')

    # Evaluate on test set
    y_pred = model.predict(X_test)

    accuracy = float(accuracy_score(y_test, y_pred))
    precision = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
    recall = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
    f1 = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
    cm = confusion_matrix(y_test, y_pred, labels=sorted(y.unique())).tolist()
    class_report = classification_report(y_test, y_pred, zero_division=0)
    present_labels = sorted(y.unique())

    # Feature importances
    importances = model.feature_importances_
    feature_importance_list = [
        {'feature': feat, 'importance': round(float(imp), 6)}
        for feat, imp in sorted(
            zip(FEATURE_COLUMNS, importances), key=lambda x: x[1], reverse=True
        )
    ]
    top_features = feature_importance_list[:5]

    # Metrics dict
    metrics = {
        'model': 'RandomForestClassifier',
        'n_estimators': 100,
        'class_weight': 'balanced',
        'random_state': 42,
        'train_size': int(len(X_train)),
        'test_size': int(len(X_test)),
        'accuracy': round(accuracy, 4),
        'precision_weighted': round(precision, 4),
        'recall_weighted': round(recall, 4),
        'f1_weighted': round(f1, 4),
        'confusion_matrix': cm,
        'confusion_matrix_labels': present_labels,
        'classification_report': class_report,
        'class_labels': present_labels,
        'feature_importances': feature_importance_list,
        'top_features': top_features,
        'feature_columns': FEATURE_COLUMNS,
        'target_column': TARGET_COLUMN,
        'dataset_rows': int(len(df)),
        'academic_disclaimer': (
            'This is an academic prototype trained on synthetic Synthea data '
            'with synthetically generated adherence events. It is NOT a '
            'clinically validated model. Predictions are not medical diagnoses.'
        ),
    }

    # Print evaluation summary
    print('\n' + '=' * 60)
    print('MODEL EVALUATION (Test Set)')
    print('=' * 60)
    print(f'  Accuracy          : {accuracy:.4f}')
    print(f'  Precision (wtd)   : {precision:.4f}')
    print(f'  Recall (wtd)      : {recall:.4f}')
    print(f'  F1-score (wtd)    : {f1:.4f}')
    print(f'\n  Confusion matrix (labels={present_labels}):')
    for row in cm:
        print(f'    {row}')
    print(f'\n  Classification report:\n{class_report}')
    print(f'\n  Top features:')
    for item in top_features:
        bar = '█' * int(item['importance'] * 40)
        print(f'    {item["feature"]:<30} {bar} {item["importance"]:.4f}')
    print('=' * 60)

    # Save artefacts
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    # Save model with metadata
    artifact = {
        'model': model,
        'feature_columns': FEATURE_COLUMNS,
        'target_column': TARGET_COLUMN,
        'class_labels': present_labels,
        'gender_encoding': {'M': 0, 'F': 1, 'U': 2},
    }
    joblib.dump(artifact, MODEL_PATH)
    print(f'\nModel saved → {MODEL_PATH}')

    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding='utf-8')
    print(f'Metrics saved → {METRICS_PATH}')

    return metrics


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dataset', type=Path, default=DATASET_CSV)
    args = parser.parse_args()
    train(args.dataset)


if __name__ == '__main__':
    main()
