from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class MedicationHistory(Base):
    __tablename__ = "medication_history"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    medicine_id: Mapped[int] = mapped_column(
        ForeignKey("medicines.id"),
        nullable=False,
    )

    scheduled_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    taken: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False,
    )