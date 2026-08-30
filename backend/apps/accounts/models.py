from enum import Enum

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base


class UserRole(str, Enum):
    PATIENT = "PATIENT"
    CAREGIVER = "CAREGIVER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        "user_id",
        primary_key=True,
        index=True,
    )

    full_name: Mapped[str] = mapped_column(
        "name",
        String(100),
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True,
    )

    hashed_password: Mapped[str] = mapped_column(
        "password_hash",
        Text,
    )

    role: Mapped[UserRole] = mapped_column(
        default=UserRole.PATIENT,
    )