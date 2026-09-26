from ml.src.refill_prediction.engine import RefillPredictionEngine


def test_refill_prediction_engine_worked_example():
    # Worked example from PillSync specification:
    # Initial stock: 60 tablets
    # Dosage: 2 tablets per day
    # Estimated refill requirement: 60 / 2 = 30 days
    res = RefillPredictionEngine.predict_depletion(
        initial_stock=60,
        daily_dosage_frequency=2.0,
        quantity_per_dose=1.0,
        medicine_name="BP Medicine",
    )

    assert res["days_remaining"] == 30
    assert res["daily_consumption"] == 2.0
    assert res["is_low_stock"] is False


def test_refill_prediction_engine_low_stock_warning():
    res = RefillPredictionEngine.predict_depletion(
        initial_stock=8,
        daily_dosage_frequency=2.0,
        quantity_per_dose=1.0,
        medicine_name="Blood Pressure Med",
    )

    assert res["days_remaining"] == 4
    assert res["is_low_stock"] is True
    assert "Your Blood Pressure Med is expected to finish in 4 days" in res["warning_message"]
