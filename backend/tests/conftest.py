"""Shared fixtures.

Two flavours of test are supported:

- **unit** — model-level tests against a throwaway in-memory SQLite database
  (`db_session` fixture). No network, no Postgres, runs anywhere instantly.
- **integration** — tests that exercise the real FastAPI app (`client`
  fixture) over its actual `DATABASE_URL` (a real Postgres — from
  `backend/.env` locally, or the `postgres` service container in CI).
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from apps.common.model_registry import Base


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """A fresh in-memory SQLite database, schema created fresh per test."""

    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)

    # SQLite ignores FK constraints (and therefore ON DELETE CASCADE) unless
    # explicitly told not to — without this, the models behave differently
    # under test (SQLite) than in production (Postgres, which always enforces
    # them).
    @event.listens_for(engine.sync_engine, "connect")
    def _enable_sqlite_fk(dbapi_connection, connection_record):  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """An httpx client wired directly to the real FastAPI app (ASGI, no socket)."""

    from config.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
