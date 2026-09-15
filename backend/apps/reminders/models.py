"""Milestone 1 scope: the `Reminder` table.

Snooze handling, delivery fan-out (push/email/SMS) and Celery scheduling
(`apps/reminders/README.md`) are Milestone 2 work — this is the schema they
build on.
"""

from __future__ import annotations

import uuid
from datetime import datetime, time
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.common.enums import ReminderFrequency
from apps.common.models import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from apps.adherence.models import AdherenceLog
    from apps.medications.models import Medicine


class Reminder(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "reminders"

    medicine_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scheduled_time: Mapped[time] = mapped_column(Time, nullable=False)
    frequency: Mapped[ReminderFrequency] = mapped_column(
        Enum(ReminderFrequency, name="reminder_frequency"),
        nullable=False,
        default=ReminderFrequency.ONCE_DAILY,
    )
    # Milestone 2 additions -------------------------------------------------
    # Only meaningful for ReminderFrequency.WEEKLY. 0=Monday .. 6=Sunday
    # (Python's `date.weekday()` convention), so scheduling code never has to
    # translate between two different day-numbering schemes.
    day_of_week: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Only meaningful for ReminderFrequency.CUSTOM — repeat every N days.
    interval_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Set when a Snooze action is logged; cleared by Taken/Missed. This is
    # what "next scheduled occurrence" checks first — a snooze is a
    # one-off override of the reminder's normal recurrence, not a change to
    # the recurrence itself.
    snoozed_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    medicine: Mapped[Medicine] = relationship(back_populates="reminders")
    adherence_logs: Mapped[list[AdherenceLog]] = relationship(
        back_populates="reminder", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return f"<Reminder id={self.id} medicine_id={self.medicine_id} time={self.scheduled_time}>"
