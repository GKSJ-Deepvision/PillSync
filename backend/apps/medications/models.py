"""Milestone 1 scope: the `Medicine` table backing the whole medication domain.

Dosage scheduling, OCR-populated fields and disease-based categorisation
(`apps/medications/README.md`) build on this table from Milestone 2 onward;
what's needed now is the shape the refill engine and reminders will key off:
stock, threshold, and ownership.
"""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.common.enums import MedicineForm
from apps.common.models import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Medicine(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "medicines"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    form: Mapped[MedicineForm] = mapped_column(
        Enum(MedicineForm, name="medicine_form"), nullable=False, default=MedicineForm.TABLET
    )
    total_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    remaining_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    refill_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    reminders: Mapped[list[Reminder]] = relationship(  # noqa: F821
        back_populates="medicine", cascade="all, delete-orphan"
    )
    refill_logs: Mapped[list[RefillLog]] = relationship(  # noqa: F821
        back_populates="medicine", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return (
            f"<Medicine id={self.id} name={self.name!r} "
            f"remaining={self.remaining_quantity}/{self.total_quantity}>"
        )
