"""The adherence definitions, pinned on plain records."""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from apps.adherence import engine
from apps.adherence.engine import MISSED, SKIPPED, TAKEN, Record

D0 = date(2026, 3, 2)  # a Monday


def rec(offset, status=TAKEN, slot="MORNING", medicine="Metformin", delay=0.0):
    return Record(
        day=D0 + timedelta(days=offset),
        slot=slot,
        status=status,
        medicine=medicine,
        delay_minutes=delay if status == TAKEN else None,
    )


class TestTotals:
    def test_rate_is_taken_over_taken_plus_missed(self):
        t = engine.totals([rec(0), rec(1), rec(2), rec(3, MISSED)])
        assert t["adherence_rate"] == 75.0
        assert t["resolved"] == 4

    def test_skipped_doses_are_neither_success_nor_failure(self):
        t = engine.totals([rec(0), rec(1, SKIPPED), rec(2, SKIPPED)])
        assert t["adherence_rate"] == 100.0
        assert t["skipped"] == 2

    def test_no_resolved_doses_is_none_not_zero_or_hundred(self):
        assert engine.totals([])["adherence_rate"] is None
        assert engine.totals([rec(0, SKIPPED)])["adherence_rate"] is None

    def test_on_time_uses_a_sixty_minute_window_either_side(self):
        t = engine.totals(
            [rec(0, delay=10), rec(1, delay=-45), rec(2, delay=61), rec(3, delay=240)]
        )
        assert t["on_time_rate"] == 50.0
        assert t["average_delay_minutes"] == pytest.approx(66.5)

    def test_a_late_dose_still_counts_as_taken(self):
        t = engine.totals([rec(0, delay=300)])
        assert t["adherence_rate"] == 100.0
        assert t["on_time_rate"] == 0.0


class TestStreaks:
    def test_current_streak_counts_back_to_the_last_miss(self):
        records = [rec(0), rec(1, MISSED), rec(2), rec(3), rec(4)]
        assert engine.streaks(records) == {"current": 3, "longest": 3}

    def test_a_miss_today_breaks_it(self):
        records = [rec(0), rec(1), rec(2, MISSED)]
        assert engine.streaks(records)["current"] == 0
        assert engine.streaks(records)["longest"] == 2

    def test_a_day_with_one_miss_among_takes_is_not_perfect(self):
        records = [rec(0), rec(0, MISSED, slot="NIGHT"), rec(1)]
        assert engine.streaks(records)["current"] == 1

    def test_days_without_doses_do_not_break_a_streak(self):
        records = [rec(0), rec(1), rec(5), rec(6)]  # nothing scheduled days 2-4
        assert engine.streaks(records)["current"] == 4

    def test_a_skipped_only_day_is_neutral(self):
        records = [rec(0), rec(1, SKIPPED), rec(2)]
        assert engine.streaks(records)["current"] == 2

    def test_empty(self):
        assert engine.streaks([]) == {"current": 0, "longest": 0}


class TestConsistency:
    def test_share_of_days_that_were_perfect(self):
        records = [rec(0), rec(1, MISSED), rec(2), rec(3, MISSED)]
        assert engine.consistency(records) == 50.0

    def test_none_without_data(self):
        assert engine.consistency([]) is None


class TestTrend:
    def window(self, first_half, second_half):
        records = []
        for i in range(7):
            records.append(rec(i, TAKEN if i < first_half else MISSED))
        for i in range(7, 14):
            records.append(rec(i, TAKEN if i - 7 < second_half else MISSED))
        return records

    def test_improving(self):
        result = engine.trend(self.window(3, 7), D0, D0 + timedelta(days=13))
        assert result["direction"] == engine.IMPROVING
        assert result["change"] > 5

    def test_declining(self):
        result = engine.trend(self.window(7, 3), D0, D0 + timedelta(days=13))
        assert result["direction"] == engine.DECLINING

    def test_small_changes_are_stable(self):
        result = engine.trend(self.window(6, 6), D0, D0 + timedelta(days=13))
        assert result["direction"] == engine.STABLE

    def test_unknown_when_a_half_has_no_data(self):
        records = [rec(i) for i in range(7, 14)]
        result = engine.trend(records, D0, D0 + timedelta(days=13))
        assert result["direction"] == engine.UNKNOWN

    def test_unknown_for_a_tiny_window(self):
        assert engine.trend([rec(0)], D0, D0 + timedelta(days=2))["direction"] == engine.UNKNOWN


class TestDailySeries:
    def test_every_day_is_present_including_empty_ones(self):
        series = engine.daily_series([rec(0), rec(2, MISSED)], D0, D0 + timedelta(days=3))
        assert [row["date"] for row in series] == [D0 + timedelta(days=i) for i in range(4)]
        assert series[1]["adherence_rate"] is None
        assert series[2]["missed"] == 1


class TestMissedAnalysis:
    def test_a_clear_night_time_pattern_is_called_out(self):
        records = []
        for i in range(12):
            records.append(rec(i, TAKEN, slot="MORNING"))
            records.append(rec(i, MISSED if i % 3 else TAKEN, slot="NIGHT"))
        analysis = engine.missed_analysis(records)

        assert analysis["by_slot"]["NIGHT"]["missed"] == 8
        assert any("night" in line for line in analysis["insights"])

    def test_small_samples_are_not_called_a_pattern(self):
        records = [rec(0, MISSED, slot="NIGHT"), rec(1, TAKEN, slot="NIGHT"), rec(0)]
        assert engine.missed_analysis(records)["insights"] == []

    def test_an_even_spread_produces_no_insight(self):
        records = []
        for i in range(14):
            for slot in ("MORNING", "NIGHT"):
                records.append(rec(i, MISSED if i % 4 == 0 else TAKEN, slot=slot))
        assert engine.missed_analysis(records)["insights"] == []

    def test_weekdays_are_named(self):
        records = [rec(i, TAKEN) for i in range(14)]
        assert set(engine.missed_analysis(records)["by_weekday"]) == set(engine.WEEKDAYS.values())

    def test_medicines_are_ranked_by_misses(self):
        records = [rec(i, MISSED, medicine="B") for i in range(3)] + [rec(9, MISSED, medicine="A")]
        assert list(engine.missed_analysis(records)["by_medicine"]) == ["B", "A"]


class TestAgainstAnIndependentCalculation:
    """Cross-check the engine against a deliberately naive re-implementation.

    The naive version below shares no code with `adherence.engine`: it walks the
    records with plain loops and dictionaries. Agreement over a few hundred random
    histories is the measured "adherence calculation accuracy" in
    docs/reports/performance.md - it shows the maths matches its stated
    definitions, not that the definitions suit every clinical purpose.
    """

    @staticmethod
    def naive(records):
        taken = sum(1 for r in records if r.status == TAKEN)
        missed = sum(1 for r in records if r.status == MISSED)
        rate = None if taken + missed == 0 else round(100.0 * taken / (taken + missed), 1)

        per_day = {}
        for r in records:
            if r.status in (TAKEN, MISSED):
                t, m = per_day.get(r.day, (0, 0))
                per_day[r.day] = (t + (r.status == TAKEN), m + (r.status == MISSED))
        perfect = sorted(d for d, (t, m) in per_day.items() if m == 0 and t > 0)
        broken = {d for d, (t, m) in per_day.items() if not (m == 0 and t > 0)}

        current = 0
        for d in sorted(per_day, reverse=True):
            if d in broken:
                break
            current += 1
        longest = run = 0
        for d in sorted(per_day):
            run = 0 if d in broken else run + 1
            longest = max(longest, run)
        consistency = None if not per_day else round(100.0 * len(perfect) / len(per_day), 1)
        return rate, current, longest, consistency

    @staticmethod
    def random_history(seed):
        import random

        rng = random.Random(seed)
        records = []
        for offset in range(rng.randint(0, 60)):
            for slot in rng.sample(["MORNING", "AFTERNOON", "EVENING", "NIGHT"], rng.randint(0, 4)):
                status = rng.choices([TAKEN, MISSED, SKIPPED], weights=[70, 22, 8])[0]
                records.append(rec(offset, status, slot=slot, delay=rng.uniform(-30, 200)))
        return records

    def test_three_hundred_random_histories_agree_exactly(self):
        for seed in range(300):
            records = self.random_history(seed)
            expected_rate, current, longest, consistency = self.naive(records)

            assert engine.totals(records)["adherence_rate"] == expected_rate, seed
            assert engine.streaks(records) == {"current": current, "longest": longest}, seed
            assert engine.consistency(records) == consistency, seed


class TestTrendNeedsEnoughDoses:
    """A direction claimed from a handful of doses is noise, so it is not claimed."""

    def test_two_doses_a_half_is_not_a_trend(self):
        records = [rec(0, MISSED), rec(1, TAKEN), rec(5, TAKEN), rec(6, TAKEN)]
        result = engine.trend(records, D0, D0 + timedelta(days=6))
        assert result["direction"] == engine.UNKNOWN
        assert result["change"] is None

    def test_a_week_of_one_dose_a_day_cannot_call_a_trend(self):
        # 3 doses in the first half, 4 in the second: below the minimum of 6 each.
        records = [rec(i, MISSED if i < 2 else TAKEN) for i in range(7)]
        assert engine.trend(records, D0, D0 + timedelta(days=6))["direction"] == engine.UNKNOWN

    def test_enough_doses_in_both_halves_can(self):
        records = [rec(i, MISSED if i < 4 else TAKEN) for i in range(14)]
        assert engine.trend(records, D0, D0 + timedelta(days=13))["direction"] == engine.IMPROVING

    def test_the_minimum_is_stated_once(self):
        assert engine.MIN_TREND_DOSES == 6
