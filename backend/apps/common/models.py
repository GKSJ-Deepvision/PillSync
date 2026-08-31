"""Shared SQLAlchemy building blocks: the declarative Base and mixins.

Every model in every app inherits from `Base` (so Alembic sees one metadata
object) and, in almost all cases, from `UUIDPrimaryKeyMixin` and
`TimestampMixin` too.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Shared declarative base. Alembic's `env.py` targets `Base.metadata`."""


class UUIDPrimaryKeyMixin:
    """Adds a UUID primary key, generated application-side.

    Using `sqlalchemy.Uuid` (rather than `postgresql.UUID`) keeps model
    definitions portable — the same models run against PostgreSQL in
    production and against SQLite in fast unit tests.
    """

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )


class TimestampMixin:
    """Adds `created_at` / `updated_at`, both maintained by the database."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
