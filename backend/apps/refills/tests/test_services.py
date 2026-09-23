from datetime import date, timedelta

from apps.refills.services import (
    days_of_stock_remaining,
    estimated_depletion_date,
    is_low_stock,
    recommended_refill_date,
    refill_notification_message,
)


def test_days_remaining_matches_spec_example():
    # Spec example: 60 tablets, 2/day -> 30 days
    assert days_of_stock_remaining(60, 2) == 30


def test_days_remaining_handles_zero_consumption():
    assert days_of_stock_remaining(60, 0) is None


def test_estimated_depletion_date_adds_days_to_reference_date():
    ref = date(2026, 1, 1)
    result = estimated_depletion_date(60, 2, as_of=ref)
    assert result == ref + timedelta(days=30)


def test_estimated_depletion_date_none_when_no_consumption():
    assert estimated_depletion_date(60, 0) is None


def test_recommended_refill_date_subtracts_lead_time():
    ref = date(2026, 1, 1)
    result = recommended_refill_date(60, 2, lead_time_days=5, as_of=ref)
    assert result == ref + timedelta(days=25)


def test_is_low_stock_true_within_threshold():
    # 10 units / 2 per day = 5 days left, threshold 5 -> low stock
    assert is_low_stock(10, 2, threshold_days=5) is True


def test_is_low_stock_false_when_plenty_remains():
    # 60 units / 2 per day = 30 days left, threshold 5 -> not low stock
    assert is_low_stock(60, 2, threshold_days=5) is False


def test_is_low_stock_false_when_consumption_unknown():
    assert is_low_stock(60, 0) is False


def test_refill_notification_message_matches_spec_wording():
    msg = refill_notification_message("BP medicine", 5)
    assert msg == "Your BP medicine is expected to finish in 5 days. Please arrange a refill."


def test_refill_notification_message_rounds_fractional_days():
    msg = refill_notification_message("Metformin", 4.6)
    assert "5 days" in msg
