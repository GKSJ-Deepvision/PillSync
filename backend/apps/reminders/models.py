"""Milestone 1 scope: the `Reminder` table.

Snooze handling, delivery fan-out (push/email/SMS) and Celery scheduling
(`apps/reminders/README.md`) are Milestone 2 work — this is the schema they
build on.
"""

from __future__ import annotations

import uuid
from datetime import time

from sqlalchemy import Boolean, Enum, ForeignKey, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.common.enums import ReminderFrequency
from apps.common.models import Base, TimestampMixin, UUIDPrimaryKeyMixin


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
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    medicine: Mapped[Medicine] = relationship(back_populates="reminders")  # noqa: F821
    adherence_logs: Mapped[list[AdherenceLog]] = relationship(  # noqa: F821
        back_populates="reminder", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return f"<Reminder id={self.id} medicine_id={self.medicine_id} time={self.scheduled_time}>"
