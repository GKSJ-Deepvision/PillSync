"""Train and select the refill-prediction adherence model.

Usage
-----
    python -m ml.src.refill_prediction.train

Trains several candidate regressors on the synthetic adherence dataset
(``synthetic_data.generate_training_frame``), picks the one with the lowest
cross-validated MAE, evaluates it on a held-out test split, and writes:

    ml/models/refill_predictor.joblib          — the fitted sklearn model
    ml/models/refill_predictor_metadata.json   — feature names, metrics,
                                                  chosen algorithm, version

Why the winner is usually a Random Forest
------------------------------------------
The target (a patient's *future* adherence rate) depends on **interactions**
between features — e.g. a declining trend matters more when volatility is
already high, and the weekend effect only shows up for people with mid-range
base adherence — rather than a smooth linear combination of them. Tree
ensembles capture that without any manual feature-crossing or scaling, and
are robust to the mixed continuous/categorical-code inputs here. That's why
Random Forest and Gradient Boosting are included as candidates alongside a
plain Linear Regression baseline, and the benchmark below picks whichever
actually wins on this data rather than assuming it upfront.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import KFold, cross_val_score, train_test_split

from .features import FEATURE_NAMES
from .synthetic_data import generate_training_frame

MODELS_DIR = Path(__file__).resolve().parents[2] / "models"
MODEL_PATH = MODELS_DIR / "refill_predictor.joblib"
METADATA_PATH = MODELS_DIR / "refill_predictor_metadata.json"

CANDIDATES = {
    "baseline_mean": DummyRegressor(strategy="mean"),
    "linear_regression": LinearRegression(),
    "random_forest": RandomForestRegressor(
        n_estimators=300, max_depth=8, min_samples_leaf=4, random_state=42, n_jobs=-1
    ),
    "gradient_boosting": GradientBoostingRegressor(
        n_estimators=200, max_depth=3, learning_rate=0.05, random_state=42
    ),
}


def run(n_samples: int = 6000, seed: int = 42) -> dict:
    frame = generate_training_frame(n_samples=n_samples, seed=seed)
    X = frame[FEATURE_NAMES].to_numpy()
    y = frame["label_future_adherence"].to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=seed)
    cv = KFold(n_splits=5, shuffle=True, random_state=seed)

    leaderboard = {}
    for name, model in CANDIDATES.items():
        scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="neg_mean_absolute_error")
        leaderboard[name] = float(-scores.mean())

    best_name = min(leaderboard, key=leaderboard.get)
    best_model = CANDIDATES[best_name]
    best_model.fit(X_train, y_train)

    y_pred = best_model.predict(X_test)
    test_mae = float(mean_absolute_error(y_test, y_pred))
    test_r2 = float(r2_score(y_test, y_pred))

    feature_importance = None
    if hasattr(best_model, "feature_importances_"):
        feature_importance = dict(zip(FEATURE_NAMES, [float(v) for v in best_model.feature_importances_]))

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, MODEL_PATH)

    metadata = {
        "algorithm": best_name,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "n_samples": n_samples,
        "feature_names": FEATURE_NAMES,
        "cv_mae_leaderboard": leaderboard,
        "test_mae": test_mae,
        "test_r2": test_r2,
        "feature_importance": feature_importance,
        "version": "1.0.0",
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2))
    return metadata


if __name__ == "__main__":
    result = run()
    print(json.dumps(result, indent=2))
