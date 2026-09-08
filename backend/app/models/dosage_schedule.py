from datetime import time

from sqlalchemy import ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class DosageSchedule(Base):
    __tablename__ = "dosage_schedules"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    medicine_id: Mapped[int] = mapped_column(
        ForeignKey("medicines.id"),
        nullable=False,
    )

    dosage_amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    time_of_day: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    frequency: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )