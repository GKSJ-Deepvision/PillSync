"""Next-occurrence computation for a `Reminder`.

Deliberately a pure function of the reminder's own fields (plus "now") and
nothing else — no DB session, no I/O — so it's trivial to unit test and so
later milestones (notification dispatch, refill engine) can call it without
pulling in the whole reminders app.

Scope note: this milestone computes "next occurrence" in UTC. `UserProfile`
already carries a `timezone` field (Milestone 1), but converting scheduled
wall-clock times to a per-patient timezone is left to whichever later
milestone wires the notification dispatcher — see the Milestone 2 report's
"Blockers and open questions" section.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta

from apps.common.enums import ReminderFrequency

# Frequencies that repeat on every calendar day at their own scheduled_time.
# TWICE_DAILY / THREE_TIMES_DAILY reminders are represented as multiple
# Reminder rows (one per time-of-day slot — see `ReminderCreate` in
# schemas.py), so from a single row's point of view they recur daily just
# like ONCE_DAILY.
_DAILY_FREQUENCIES = frozenset(
    {
        ReminderFrequency.ONCE_DAILY,
        ReminderFrequency.TWICE_DAILY,
        ReminderFrequency.THREE_TIMES_DAILY,
    }
)


def _combine_utc(day: date, scheduled_time: time) -> datetime:
    return datetime.combine(day, scheduled_time, tzinfo=UTC)


def compute_next_occurrence(
    *,
    frequency: ReminderFrequency,
    scheduled_time: time,
    is_active: bool,
    created_at: datetime,
    day_of_week: int | None = None,
    interval_days: int | None = None,
    snoozed_until: datetime | None = None,
    now: datetime | None = None,
) -> datetime | None:
    """Returns the next datetime (UTC) this reminder is due, or `None` if it
    has no future occurrence to compute (inactive, or AS_NEEDED with no
    active snooze).

    A pending snooze always wins over the normal recurrence: that's the
    entire point of snoozing — the next thing that should fire is the
    snoozed time, not whatever the underlying schedule would otherwise say.
    """

    now = now or datetime.now(UTC)

    if not is_active:
        return None

    if snoozed_until is not None and snoozed_until > now:
        return snoozed_until

    if frequency in _DAILY_FREQUENCIES:
        candidate = _combine_utc(now.date(), scheduled_time)
        if candidate <= now:
            candidate += timedelta(days=1)
        return candidate

    if frequency == ReminderFrequency.WEEKLY:
        target_weekday = day_of_week if day_of_week is not None else created_at.weekday()
        days_ahead = (target_weekday - now.weekday()) % 7
        candidate = _combine_utc(now.date() + timedelta(days=days_ahead), scheduled_time)
        if candidate <= now:
            candidate += timedelta(days=7)
        return candidate

    if frequency == ReminderFrequency.CUSTOM:
        step = interval_days if interval_days and interval_days > 0 else 1
        anchor = _combine_utc(created_at.date(), scheduled_time)
        if anchor > now:
            return anchor
        elapsed_days = (now.date() - anchor.date()).days
        cycles_passed = elapsed_days // step
        candidate = anchor + timedelta(days=cycles_passed * step)
        while candidate <= now:
            candidate += timedelta(days=step)
        return candidate

    # AS_NEEDED has no fixed recurrence — nothing to compute unless a snooze
    # (handled above) is pending.
    return None
