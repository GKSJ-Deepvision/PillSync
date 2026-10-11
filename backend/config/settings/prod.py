import os

import dj_database_url

from .base import *  # noqa: F403
from .base import BASE_DIR, MIDDLEWARE # noqa: F403

DEBUG = False

ALLOWED_HOSTS = [host.strip() for host in os.getenv("ALLOWED_HOSTS", "").split(",") if host.strip()]
if not ALLOWED_HOSTS:
    raise ValueError("ALLOWED_HOSTS must contain at least one production host.")

CSRF_TRUSTED_ORIGINS = [
    origin.strip() for origin in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",") if origin.strip()
]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = (
    os.getenv("SECURE_HSTS_INCLUDE_SUBDOMAINS", "False").lower() == "true"
)
SECURE_HSTS_PRELOAD = os.getenv("SECURE_HSTS_PRELOAD", "False").lower() == "true"

DATABASE_CONN_MAX_AGE = int(os.getenv("DATABASE_CONN_MAX_AGE", "60"))
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=DATABASE_CONN_MAX_AGE,
            ssl_require=True,
        )
    }
else:
    required_database_settings = {
        name: os.getenv(name, "").strip()
        for name in (
            "POSTGRES_DB",
            "POSTGRES_USER",
            "POSTGRES_PASSWORD",
            "POSTGRES_HOST",
        )
    }
    missing_database_settings = [
        name for name, value in required_database_settings.items() if not value
    ]
    if missing_database_settings:
        raise ValueError(
            "Configure DATABASE_URL or the complete PostgreSQL fallback "
            f"(missing: {', '.join(missing_database_settings)})."
        )
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            **required_database_settings,
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": DATABASE_CONN_MAX_AGE,
            "OPTIONS": {"sslmode": os.getenv("POSTGRES_SSLMODE", "require")},
        }
    }

STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
MIDDLEWARE.insert(
    1,
    "whitenoise.middleware.WhiteNoiseMiddleware",
)
