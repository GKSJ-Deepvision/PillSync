"""Milestone 1 scope: the `AdherenceLog` table.

Percentage calculations, weekly/monthly reports and trend analysis
(`apps/adherence/README.md`) are Milestone 3 work built on top of this event
log — one row per Taken/Missed/Snoozed action.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.common.enums import AdherenceStatus
from apps.common.models import Base, UUIDPrimaryKeyMixin


class AdherenceLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "adherence_logs"

    reminder_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("reminders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[AdherenceStatus] = mapped_column(
        Enum(AdherenceStatus, name="adherence_status"), nullable=False
    )
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    reminder: Mapped[Reminder] = relationship(back_populates="adherence_logs")  # noqa: F821

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return (
            f"<AdherenceLog id={self.id} reminder_id={self.reminder_id} status={self.status.value}>"
        )
