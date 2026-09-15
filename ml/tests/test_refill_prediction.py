from datetime import date, timedelta
from pathlib import Path

from ml.src.refill_prediction.features import build_features, daily_dose_from_schedules
from ml.src.refill_prediction.model import RefillPredictor

_MISSING = Path("/nonexistent-model-path-for-tests")


def _daily_logs(start: date, n_days: int, status: str, dose_quantity: float = 2):
    return [
        {
            "scheduled_for": (start + timedelta(days=i)).isoformat(),
            "status": status,
            "dose_quantity": dose_quantity,
        }
        for i in range(n_days)
    ]


def test_spec_worked_example_60_tablets_2_per_day_is_30_days_when_fully_adherent():
    """Matches the milestone-3 spec example with no dose history (fallback = 100% adherence)."""
    schedules = [{"dose_quantity": 2, "days_of_week": list(range(7)), "is_active": True}]
    predictor = RefillPredictor(model_path=_MISSING, metadata_path=_MISSING)
    result = predictor.predict(
        medication={"id": "m1", "name": "BP tablet", "stock_quantity": 60, "refill_lead_days": 5},
        schedules=schedules,
        dose_logs=[],
        today=date(2026, 1, 1),
    )
    assert result.prescribed_daily_dose == 2
    assert result.days_remaining == 30
    assert result.depletion_date == "2026-01-31"
    assert result.stock_status == "ok"
    assert result.model_version == "fallback-rule-based"


def test_daily_dose_total_honours_partial_week_schedule():
    schedules = [{"dose_quantity": 1, "days_of_week": [1, 3, 5], "is_active": True}]
    assert round(daily_dose_from_schedules(schedules), 4) == round(3 / 7, 4)


def test_no_active_schedule_returns_no_schedule_status():
    predictor = RefillPredictor(model_path=_MISSING, metadata_path=_MISSING)
    result = predictor.predict(medication={"stock_quantity": 10}, schedules=[], today=date(2026, 1, 1))
    assert result.stock_status == "no-schedule"
    assert result.days_remaining is None


def test_low_adherence_history_extends_days_remaining_with_trained_model():
    """A patient with a well-established history of only ~50% adherence
    should be predicted to run out *later* than the naive prescribed-dose
    calculation, once the trained model is available and confidence is high."""
    schedules = [{"dose_quantity": 2, "days_of_week": list(range(7)), "is_active": True}]
    start = date(2025, 11, 1)
    logs = []
    for i in range(45):
        status = "taken" if i % 2 == 0 else "missed"
        logs.append(
            {
                "scheduled_for": (start + timedelta(days=i)).isoformat(),
                "status": status,
                "dose_quantity": 2,
            }
        )
    predictor = RefillPredictor()  # real trained artifact, if present
    result = predictor.predict(
        medication={"id": "m2", "name": "Thyroid tablet", "stock_quantity": 60, "refill_lead_days": 5},
        schedules=schedules,
        dose_logs=logs,
        today=start + timedelta(days=45),
    )
    naive_days_remaining = 60 // 2  # what the old rule-based formula would say
    if predictor.model is not None:
        assert result.confidence > 0.9
        assert result.days_remaining >= naive_days_remaining
    assert result.adherence_risk in {"stable", "watch", "declining", "insufficient-data"}


def test_missed_dose_streak_flags_declining_adherence_risk():
    schedules = [{"dose_quantity": 1, "days_of_week": list(range(7)), "is_active": True}]
    start = date(2025, 11, 1)
    logs = _daily_logs(start, 20, "taken") + _daily_logs(start + timedelta(days=20), 5, "missed")
    predictor = RefillPredictor()
    result = predictor.predict(
        medication={"id": "m3", "stock_quantity": 30, "refill_lead_days": 5},
        schedules=schedules,
        dose_logs=logs,
        today=start + timedelta(days=25),
    )
    assert result.adherence_risk == "declining"


def test_build_features_returns_expected_length_and_prescribed_dose():
    schedules = [{"dose_quantity": 2, "days_of_week": list(range(7)), "is_active": True}]
    bundle = build_features({"stock_quantity": 40}, schedules, [], today=date(2026, 1, 1))
    assert bundle.prescribed_daily_dose == 2
    assert len(bundle.values) == len(bundle.names)
