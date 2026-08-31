"""Type-safe environment configuration for the PillSync backend.

Every setting is read from the environment (or `backend/.env` in local dev via
`pydantic-settings`'s dotenv support). Nothing here should ever hold a real
secret — see `backend/.env.example` for the variable names and dummy values.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Core -------------------------------------------------------------
    PROJECT_NAME: str = "PillSync"
    ENVIRONMENT: str = Field(default="development")  # development | staging | production
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # --- Security / JWT -----------------------------------------------------
    SECRET_KEY: str = Field(..., min_length=16)
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_LIFETIME_MINUTES: int = 30
    JWT_REFRESH_TOKEN_LIFETIME_DAYS: int = 7
    OAUTH2_CLIENT_ID: str | None = None
    OAUTH2_CLIENT_SECRET: str | None = None

    # --- Database -----------------------------------------------------------
    # Async DSN, e.g. postgresql+asyncpg://pillsync:pillsync@localhost:5432/pillsync
    #
    # Kept as `str` (not `PostgresDsn`) and normalized below rather than
    # validated as a URL: CI (see .github/workflows/ci.yml) composes this as
    # a plain `postgres://...` connection string, which is a valid libpq DSN
    # but not the `+asyncpg` driver SQLAlchemy's async engine needs. Coercing
    # it here means both CI's env var and a hand-written `.env` value work
    # without either one needing to know about the other.
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 5
    DATABASE_ECHO: bool = False

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def use_asyncpg_driver(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+asyncpg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    # --- CORS -----------------------------------------------------------
    CORS_ALLOWED_ORIGINS: list[AnyHttpUrl] | list[str] = ["http://localhost:5173"]

    @field_validator("CORS_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def split_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    # --- Background jobs (used from Milestone 2 onward) ----------------------
    CELERY_BROKER_URL: str | None = None
    CELERY_RESULT_BACKEND: str | None = None

    # --- OCR / AI (used from Milestone 3 onward) -----------------------------
    TESSERACT_CMD: str | None = None
    OPENAI_API_KEY: str | None = None

    # --- Notifications (used from Milestone 2 onward) ------------------------
    FIREBASE_CREDENTIALS_PATH: str | None = None
    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_FROM_NUMBER: str | None = None
    SENDGRID_API_KEY: str | None = None
    DEFAULT_FROM_EMAIL: str = "noreply@pillsync.local"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached settings accessor.

    `lru_cache` means `.env` is only parsed once per process; tests that need a
    different configuration should call `get_settings.cache_clear()` first.
    """

    return Settings()  # type: ignore[call-arg]


settings = get_settings()
