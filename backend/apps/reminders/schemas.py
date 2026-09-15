"""Request/response schemas for `apps.reminders.routes`."""

from __future__ import annotations

import uuid
from datetime import datetime, time

from pydantic import BaseModel, ConfigDict, Field, model_validator

from apps.common.enums import ReminderFrequency

# How many `times` a create request must supply for each frequency. Frequencies
# not listed accept exactly one time (the common case).
_REQUIRED_TIME_COUNT: dict[ReminderFrequency, int] = {
    ReminderFrequency.TWICE_DAILY: 2,
    ReminderFrequency.THREE_TIMES_DAILY: 3,
}


class ReminderCreate(BaseModel):
    """Creates one reminder per entry in `times`.

    A single request is the natural unit for "set up reminders for this
    medicine" — e.g. `frequency=TWICE_DAILY, times=[08:00, 20:00]` creates two
    `Reminder` rows sharing that frequency, one per time-of-day slot. This is
    what exposes the spec's "morning / afternoon / night" wording at the API
    level without storing more than one time per row.
    """

    medicine_id: uuid.UUID
    user_id: uuid.UUID
    frequency: ReminderFrequency = ReminderFrequency.ONCE_DAILY
    times: list[time] = Field(min_length=1, max_length=10)
    day_of_week: int | None = Field(
        default=None,
        ge=0,
        le=6,
        description="0=Monday..6=Sunday. Required for WEEKLY; ignored otherwise.",
    )
    interval_days: int | None = Field(
        default=None,
        ge=1,
        description="Repeat every N days. Required for CUSTOM; ignored otherwise.",
    )

    @model_validator(mode="after")
    def _validate_shape_for_frequency(self) -> ReminderCreate:
        expected = _REQUIRED_TIME_COUNT.get(self.frequency, 1)
        if len(self.times) != expected:
            raise ValueError(
                f"frequency={self.frequency.value} requires exactly {expected} "
                f"entr{'y' if expected == 1 else 'ies'} in 'times', got {len(self.times)}."
            )
        if self.frequency == ReminderFrequency.WEEKLY and self.day_of_week is None:
            raise ValueError("day_of_week is required when frequency is WEEKLY.")
        if self.frequency == ReminderFrequency.CUSTOM and not self.interval_days:
            raise ValueError("interval_days is required when frequency is CUSTOM.")
        return self


class ReminderUpdate(BaseModel):
    """Partial update — every field optional, only supplied ones change."""

    scheduled_time: time | None = None
    frequency: ReminderFrequency | None = None
    day_of_week: int | None = Field(default=None, ge=0, le=6)
    interval_days: int | None = Field(default=None, ge=1)
    is_active: bool | None = None


class ReminderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    medicine_id: uuid.UUID
    user_id: uuid.UUID
    scheduled_time: time
    frequency: ReminderFrequency
    day_of_week: int | None
    interval_days: int | None
    snoozed_until: datetime | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    next_occurrence: datetime | None = Field(
        default=None,
        description="Computed at read time — not stored. Null for an "
        "inactive reminder or an AS_NEEDED reminder with no pending snooze.",
    )
