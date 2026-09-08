from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class CaregiverPatient(Base):
    __tablename__ = "caregiver_patient"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    caregiver_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )