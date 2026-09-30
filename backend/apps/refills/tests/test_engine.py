"""The refill maths, starting from the specification's own worked example."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from apps.refills import engine
from apps.refills.engine import (
    COVERED,
    CRITICAL,
    FULL_WEIGHT_DOSES,
    LOW,
    OK,
    OUT,
    UNKNOWN,
    blend_consumption,
    predict,
    project,
)

TODAY = date(2026, 9, 5)
D = Decimal


class TestSpecificationExample:
    """'Medicine Quantity: 60 Tablets, Dosage: 2 Tablets Per Day. 60 / 2 = 30 Days.'"""

    def test_sixty_tablets_at_two_a_day_is_thirty_days(self):
        result = predict(D(60), D(2), TODAY)
        assert result.days_remaining == D(30)
        assert (result.depletion_date - TODAY).days == 30

    def test_the_example_notification_case_five_days_left(self):
        """'Your BP medicine is expected to finish in 5 days.'"""
        result = predict(D(10), D(2), TODAY)
        assert (result.depletion_date - TODAY).days == 5
        assert result.status == LOW


class TestPredict:
    def test_a_healthy_supply_is_ok(self):
        assert predict(D(60), D(2), TODAY).status == OK

    def test_the_refill_date_is_the_lead_time_before_the_stock_runs_out(self):
        result = predict(D(60), D(2), TODAY, lead_days=5)
        assert (result.depletion_date - result.recommended_refill_date).days == 5

    def test_the_refill_date_is_never_in_the_past(self):
        result = predict(D(4), D(2), TODAY, lead_days=5)
        assert result.recommended_refill_date == TODAY

    @pytest.mark.parametrize(
        ("remaining", "status"),
        [
            (D(60), OK),
            (D(12), OK),  # 6 days: outside the 5-day lead time
            (D(10), LOW),  # exactly 5 days
            (D(6), LOW),
            (D(4), CRITICAL),  # 2 days
            (D(2), CRITICAL),
            (D(0), OUT),
        ],
    )
    def test_status_bands_at_two_a_day(self, remaining, status):
        assert predict(remaining, D(2), TODAY, lead_days=5).status == status

    def test_no_stock_is_out_today(self):
        result = predict(D(0), D(2), TODAY)
        assert result.status == OUT
        assert result.depletion_date == TODAY

    def test_negative_stock_is_treated_as_out(self):
        assert predict(D(-3), D(2), TODAY).status == OUT

    def test_stock_with_no_schedule_cannot_be_predicted(self):
        result = predict(D(30), D(0), TODAY)
        assert result.status == UNKNOWN
        assert result.days_remaining is None

    def test_partial_days_round_down(self):
        """7 tablets at 2 a day covers 3.5 days; day 3 is the first short one."""
        assert (predict(D(7), D(2), TODAY).depletion_date - TODAY).days == 3

    def test_a_fractional_daily_rate(self):
        """Weekly dosing: 1 tablet a week is 1/7 per day, so 4 last 28 days."""
        result = predict(D(4), D(1) / D(7), TODAY)
        assert (result.depletion_date - TODAY).days == 28

    def test_the_lead_time_is_configurable(self):
        assert predict(D(20), D(2), TODAY, lead_days=14).status == LOW
        assert predict(D(20), D(2), TODAY, lead_days=5).status == OK


class TestCourseEnd:
    def test_a_course_that_ends_before_the_stock_needs_no_refill(self):
        """14 tablets for a 7-day antibiotic at 2 a day: never runs out."""
        result = predict(D(14), D(2), TODAY, course_end=date(2026, 9, 11))
        assert result.status == COVERED
        assert result.covers_course
        assert result.recommended_refill_date is None

    def test_running_out_on_the_last_day_of_the_course_is_not_covered(self):
        result = predict(D(14), D(2), TODAY, course_end=date(2026, 9, 12))
        assert result.status != COVERED

    def test_stock_that_will_not_last_the_course_is_flagged(self):
        result = predict(D(6), D(2), TODAY, course_end=date(2026, 9, 30))
        assert result.status in {LOW, CRITICAL}

    def test_no_stock_is_out_even_if_the_course_is_nearly_over(self):
        assert predict(D(0), D(2), TODAY, course_end=date(2026, 9, 6)).status == OUT

    def test_an_ongoing_medicine_has_no_course_end(self):
        assert predict(D(60), D(2), TODAY, course_end=None).status == OK


class TestBlendConsumption:
    def test_with_no_history_the_schedule_is_used(self):
        result = blend_consumption(D(2), D(0), 0, 0)
        assert result.average_daily == D(2)
        assert result.observed_daily is None
        assert result.observed_weight == 0.0

    def test_two_days_of_history_is_too_little_to_trust(self):
        """One missed dose in two days would read as 50% adherence."""
        result = blend_consumption(D(2), D(2), 2, 2)
        assert result.average_daily == D(2)
        assert result.observed_daily is None

    def test_plenty_of_history_uses_what_the_patient_really_took(self):
        # 14 days, took 21 units of a scheduled 2/day -> 1.5/day, fully trusted.
        result = blend_consumption(D(2), D(21), 14, FULL_WEIGHT_DOSES + 10)
        assert result.observed_daily == D("1.5")
        assert result.average_daily == D("1.5")
        assert result.observed_weight == 1.0

    def test_partial_history_blends_the_two(self):
        # Half the doses needed for full trust -> weight 0.5, halfway between 2 and 1.
        result = blend_consumption(D(2), D(10), 10, FULL_WEIGHT_DOSES // 2)
        assert result.observed_weight == 0.5
        assert result.average_daily == D("1.5")

    def test_a_patient_who_misses_doses_gets_a_later_run_out_date(self):
        adherent = predict(D(60), blend_consumption(D(2), D(28), 14, 28).average_daily, TODAY)
        forgetful = predict(D(60), blend_consumption(D(2), D(14), 14, 28).average_daily, TODAY)
        assert forgetful.depletion_date > adherent.depletion_date

    def test_the_weight_never_exceeds_one(self):
        assert blend_consumption(D(2), D(28), 14, 500).observed_weight == 1.0

    def test_no_schedule_means_the_scheduled_rate_is_zero_and_history_is_ignored(self):
        result = blend_consumption(D(0), D(10), 10, 10)
        assert result.average_daily == D(0)


class TestProject:
    def test_the_projection_falls_by_the_daily_rate(self):
        points = project(D(10), D(2), TODAY, days=3)
        assert [remaining for _day, remaining in points] == [D(10), D(8), D(6), D(4)]

    def test_the_projection_stops_at_zero_rather_than_going_negative(self):
        points = project(D(3), D(2), TODAY, days=4)
        assert [remaining for _day, remaining in points] == [D(3), D(1), D(0), D(0), D(0)]

    def test_one_point_per_day_including_today(self):
        points = project(D(10), D(1), TODAY, days=30)
        assert len(points) == 31
        assert points[0][0] == TODAY


def test_statuses_are_ordered_by_urgency():
    assert engine.STATUS_LEVEL[OUT] > engine.STATUS_LEVEL[CRITICAL] > engine.STATUS_LEVEL[LOW]
    assert engine.STATUS_LEVEL[LOW] > engine.STATUS_LEVEL[OK] == engine.STATUS_LEVEL[COVERED]
