"""Milestone 1 scope: the `RefillLog` table.

The prediction engine, low-stock alerts and caregiver notifications
(`apps/refills/README.md`) are Milestone 3 work — this is the audit trail of
stock top-ups they read from.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.common.models import Base, UUIDPrimaryKeyMixin


class RefillLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "refill_logs"

    medicine_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quantity_added: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_depletion_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    medicine: Mapped[Medicine] = relationship(back_populates="refill_logs")  # noqa: F821

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return f"<RefillLog id={self.id} medicine_id={self.medicine_id} qty={self.quantity_added}>"
