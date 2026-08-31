"""Module 2 model: `UserProfile` — the health/personal details behind a `User`.

Kept separate from `User` (rather than adding these columns to `users`) so
`accounts` stays a lean identity table and this app owns everything about a
patient's health profile, per `apps/profiles/README.md`.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.common.models import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from apps.accounts.models import User


class UserProfile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    emergency_contact: Mapped[str | None] = mapped_column(String(150), nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    medical_history_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped[User] = relationship(back_populates="profile")

    def __repr__(self) -> str:  # pragma: no cover - debugging aid only
        return f"<UserProfile id={self.id} user_id={self.user_id}>"
