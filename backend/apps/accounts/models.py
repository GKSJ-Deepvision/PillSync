"""Module 1 models: identity (`User`) and caregiver ↔ patient assignment.

Auth flows (JWT issuing, password hashing, RBAC dependencies) are out of
scope for this milestone slice — see `apps/accounts/README.md` — but the
`User` table itself has to exist here because `profiles`, `medications`,
`reminders`, `adherence` and `refills` all foreign-key into it.
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.common.enums import CaregiverAccessLevel, CaregiverMappingStatus, UserRole
from apps.common.models import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from apps.profiles.models import UserProfile


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A platform account. One row per patient, caregiver, or admin."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.PATIENT
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    profile: Mapped[UserProfile] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    caregiver_links: Mapped[list[CaregiverPatientMapping]] = relationship(
        back_populates="caregiver",
        foreign_keys="CaregiverPatientMapping.caregiver_id",
        cascade="all, delete-orphan",
    )
    patient_links: Mapped[list[CaregiverPatientMapping]] = relationship(
        back_populates="patient",
        foreign_keys="CaregiverPatientMapping.patient_id",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return f"<User id={self.id} email={self.email!r} role={self.role.value}>"


class CaregiverPatientMapping(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Links a caregiver account to a patient account they help manage."""

    __tablename__ = "caregiver_patient_mapping"

    caregiver_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    access_level: Mapped[CaregiverAccessLevel] = mapped_column(
        Enum(CaregiverAccessLevel, name="caregiver_access_level"),
        nullable=False,
        default=CaregiverAccessLevel.VIEW_ONLY,
    )
    status: Mapped[CaregiverMappingStatus] = mapped_column(
        Enum(CaregiverMappingStatus, name="caregiver_mapping_status"),
        nullable=False,
        default=CaregiverMappingStatus.PENDING,
    )

    caregiver: Mapped[User] = relationship(
        back_populates="caregiver_links", foreign_keys=[caregiver_id]
    )
    patient: Mapped[User] = relationship(back_populates="patient_links", foreign_keys=[patient_id])

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return (
            f"<CaregiverPatientMapping caregiver_id={self.caregiver_id} "
            f"patient_id={self.patient_id} status={self.status.value}>"
        )
