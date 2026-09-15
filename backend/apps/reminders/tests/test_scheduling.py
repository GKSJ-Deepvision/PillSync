"""Unit tests for `apps.reminders.scheduling.compute_next_occurrence`.

Pure function, no DB — `now` is always passed explicitly so every test is
deterministic regardless of when it actually runs.
"""

from __future__ import annotations

from datetime import UTC, datetime, time, timedelta

import pytest

from apps.common.enums import ReminderFrequency
from apps.reminders.scheduling import compute_next_occurrence

pytestmark = pytest.mark.unit

# A fixed Wednesday, used as "now" across tests unless a test needs a
# different weekday. datetime.weekday(): Mon=0 .. Sun=6.
_WED_NOON = datetime(2026, 9, 9, 12, 0, tzinfo=UTC)
assert _WED_NOON.weekday() == 2  # sanity check the fixture is what it claims


def test_inactive_reminder_has_no_next_occurrence():
    result = compute_next_occurrence(
        frequency=ReminderFrequency.ONCE_DAILY,
        scheduled_time=time(8, 0),
        is_active=False,
        created_at=_WED_NOON,
        now=_WED_NOON,
    )
    assert result is None


@pytest.mark.parametrize(
    "frequency",
    [
        ReminderFrequency.ONCE_DAILY,
        ReminderFrequency.TWICE_DAILY,
        ReminderFrequency.THREE_TIMES_DAILY,
    ],
)
def test_daily_frequencies_recur_today_if_time_not_yet_passed(frequency):
    result = compute_next_occurrence(
        frequency=frequency,
        scheduled_time=time(20, 0),  # 8pm, after the fixture's noon "now"
        is_active=True,
        created_at=_WED_NOON,
        now=_WED_NOON,
    )
    assert result == datetime(2026, 9, 9, 20, 0, tzinfo=UTC)


def test_daily_frequency_rolls_to_tomorrow_if_time_already_passed():
    result = compute_next_occurrence(
        frequency=ReminderFrequency.ONCE_DAILY,
        scheduled_time=time(8, 0),  # 8am, before the fixture's noon "now"
        is_active=True,
        created_at=_WED_NOON,
        now=_WED_NOON,
    )
    assert result == datetime(2026, 9, 10, 8, 0, tzinfo=UTC)


def test_daily_frequency_at_exactly_now_rolls_to_tomorrow():
    """A reminder due at exactly 'now' has already had its moment — the next
    one is the *next* occurrence, not this instant, or a dispatcher polling
    on a tight loop could fire it twice."""
    now = datetime(2026, 9, 9, 8, 0, tzinfo=UTC)
    result = compute_next_occurrence(
        frequency=ReminderFrequency.ONCE_DAILY,
        scheduled_time=time(8, 0),
        is_active=True,
        created_at=_WED_NOON,
        now=now,
    )
    assert result == datetime(2026, 9, 10, 8, 0, tzinfo=UTC)


def test_weekly_uses_explicit_day_of_week_when_given():
    # _WED_NOON is a Wednesday (weekday=2). Ask for Friday (weekday=4).
    result = compute_next_occurrence(
        frequency=ReminderFrequency.WEEKLY,
        scheduled_time=time(9, 0),
        is_active=True,
        created_at=_WED_NOON,
        day_of_week=4,
        now=_WED_NOON,
    )
    assert result == datetime(2026, 9, 11, 9, 0, tzinfo=UTC)  # the coming Friday


def test_weekly_falls_back_to_created_at_weekday_when_not_given():
    result = compute_next_occurrence(
        frequency=ReminderFrequency.WEEKLY,
        scheduled_time=time(9, 0),
        is_active=True,
        created_at=_WED_NOON,  # Wednesday
        day_of_week=None,
        now=_WED_NOON,
    )
    assert result.weekday() == 2  # next Wednesday


def test_weekly_rolls_to_next_week_if_this_weeks_slot_already_passed():
    # Ask for Wednesday (today) at 9am, but "now" is Wednesday noon.
    result = compute_next_occurrence(
        frequency=ReminderFrequency.WEEKLY,
        scheduled_time=time(9, 0),
        is_active=True,
        created_at=_WED_NOON,
        day_of_week=2,
        now=_WED_NOON,
    )
    assert result == datetime(2026, 9, 16, 9, 0, tzinfo=UTC)  # a week later


def test_custom_recurs_every_interval_days_from_created_at():
    created_at = datetime(2026, 9, 1, 10, 0, tzinfo=UTC)  # anchor
    now = datetime(2026, 9, 9, 12, 0, tzinfo=UTC)  # 8 days later
    result = compute_next_occurrence(
        frequency=ReminderFrequency.CUSTOM,
        scheduled_time=time(10, 0),
        is_active=True,
        created_at=created_at,
        interval_days=3,
        now=now,
    )
    # Cycle dates from Sept 1: 1, 4, 7, 10, ... — next one after Sept 9 noon is Sept 10.
    assert result == datetime(2026, 9, 10, 10, 0, tzinfo=UTC)


def test_custom_before_first_anchor_returns_the_anchor_itself():
    created_at = datetime(2026, 9, 9, 10, 0, tzinfo=UTC)
    now = datetime(2026, 9, 9, 5, 0, tzinfo=UTC)  # before the anchor time today
    result = compute_next_occurrence(
        frequency=ReminderFrequency.CUSTOM,
        scheduled_time=time(10, 0),
        is_active=True,
        created_at=created_at,
        interval_days=5,
        now=now,
    )
    assert result == created_at


def test_custom_defaults_interval_to_one_day_if_missing():
    created_at = _WED_NOON
    result = compute_next_occurrence(
        frequency=ReminderFrequency.CUSTOM,
        scheduled_time=time(8, 0),
        is_active=True,
        created_at=created_at,
        interval_days=None,
        now=_WED_NOON,
    )
    assert result == datetime(2026, 9, 10, 8, 0, tzinfo=UTC)


def test_as_needed_has_no_next_occurrence_without_a_snooze():
    result = compute_next_occurrence(
        frequency=ReminderFrequency.AS_NEEDED,
        scheduled_time=time(0, 0),
        is_active=True,
        created_at=_WED_NOON,
        now=_WED_NOON,
    )
    assert result is None


def test_pending_snooze_overrides_the_normal_recurrence():
    snoozed_until = _WED_NOON + timedelta(minutes=15)
    result = compute_next_occurrence(
        frequency=ReminderFrequency.ONCE_DAILY,
        scheduled_time=time(8, 0),  # would otherwise be "tomorrow 8am"
        is_active=True,
        created_at=_WED_NOON,
        snoozed_until=snoozed_until,
        now=_WED_NOON,
    )
    assert result == snoozed_until


def test_expired_snooze_is_ignored_in_favour_of_normal_recurrence():
    expired_snooze = _WED_NOON - timedelta(minutes=5)
    result = compute_next_occurrence(
        frequency=ReminderFrequency.ONCE_DAILY,
        scheduled_time=time(20, 0),
        is_active=True,
        created_at=_WED_NOON,
        snoozed_until=expired_snooze,
        now=_WED_NOON,
    )
    assert result == datetime(2026, 9, 9, 20, 0, tzinfo=UTC)


def test_pending_snooze_applies_even_to_as_needed():
    snoozed_until = _WED_NOON + timedelta(minutes=30)
    result = compute_next_occurrence(
        frequency=ReminderFrequency.AS_NEEDED,
        scheduled_time=time(0, 0),
        is_active=True,
        created_at=_WED_NOON,
        snoozed_until=snoozed_until,
        now=_WED_NOON,
    )
    assert result == snoozed_until
