from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    medicine_id: Mapped[int | None] = mapped_column(
        ForeignKey("medicines.id"),
        nullable=True,
    )

    prescription_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    doctor_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    issue_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    expiry_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )