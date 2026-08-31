"""FastAPI application entrypoint.

Run locally with:
    uvicorn config.main:app --reload --host 0.0.0.0 --port 8000

Or via Docker Compose (see `docker-compose.yml` at the repo root):
    docker compose up --build
"""

from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.v1.router import api_router
from config.database import engine, ping_database
from config.exceptions import register_exception_handlers
from config.settings import settings

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("pillsync")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup: fail fast and loudly if the database isn't reachable, rather
    # than letting the first request discover it.
    if await ping_database():
        logger.info("Database connection verified (%s).", settings.ENVIRONMENT)
    else:
        logger.error(
            "Could not reach the database on startup. "
            "Check DATABASE_URL and that the Postgres container is healthy."
        )

    yield

    # Shutdown: release the connection pool cleanly.
    await engine.dispose()
    logger.info("Database engine disposed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Medicine Reminder and Medication Tracking Platform API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.CORS_ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["root"])
async def root() -> dict:
    return {
        "success": True,
        "data": {
            "service": settings.PROJECT_NAME,
            "environment": settings.ENVIRONMENT,
            "docs": "/docs",
        },
    }
