"""Settings shared by every environment.

Every value that differs between machines, or that is secret, is read from the
environment. Nothing sensitive is hardcoded here - see `backend/.env.example`
for the full list of variables and copy it to `backend/.env` locally.
"""

from __future__ import annotations

import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from celery.schedules import crontab
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BASE_DIR / ".env")


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


def env_bool(name: str, default: bool = False) -> bool:
    return env(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    raw = env(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


def env_int(name: str, default: int) -> int:
    try:
        return int(env(name, str(default)))
    except ValueError:
        return default


# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

SECRET_KEY = env("SECRET_KEY", "insecure-development-key-change-me")
DEBUG = env_bool("DEBUG", False)
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1")

AUTH_USER_MODEL = "accounts.User"
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    # PillSync
    "apps.common",
    "apps.accounts",
    "apps.profiles",
    "apps.medications",
    "apps.prescriptions",
    "apps.reminders",
    "apps.notifications",
    "apps.ocr",
    "apps.refills",
    "apps.adherence",
    "apps.analytics",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.analytics.middleware.RequestTimingMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
# PostgreSQL is the target database. DATABASE_URL wins when it is set (that is
# what CI and every deployment provide); otherwise the POSTGRES_* variables are
# assembled, and a local SQLite file is the last resort so a fresh clone runs
# without any database server installed.

_DATABASE_URL = env("DATABASE_URL")
_POSTGRES_HOST = env("POSTGRES_HOST")

if _DATABASE_URL:
    DATABASES = {"default": dj_database_url.parse(_DATABASE_URL, conn_max_age=600)}
elif _POSTGRES_HOST:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("POSTGRES_DB", "pillsync"),
            "USER": env("POSTGRES_USER", "pillsync"),
            "PASSWORD": env("POSTGRES_PASSWORD"),
            "HOST": _POSTGRES_HOST,
            "PORT": env("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": 600,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# ---------------------------------------------------------------------------
# Passwords
# ---------------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 10},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.ScryptPasswordHasher",
]

# ---------------------------------------------------------------------------
# Internationalisation
# ---------------------------------------------------------------------------

LANGUAGE_CODE = "en-us"
TIME_ZONE = env("TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static and media
# ---------------------------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

# Prescription and medicine images: 10 MB is generous for a phone photo and
# small enough to keep an upload endpoint from becoming a denial-of-service hole.
MAX_UPLOAD_SIZE_BYTES = env_int("MAX_UPLOAD_SIZE_BYTES", 10 * 1024 * 1024)
DATA_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE_BYTES
FILE_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE_BYTES

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.DefaultPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.common.exceptions.pillsync_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.ScopedRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        # Per authenticated user. 5,000 a day is ~3.5 a minute around the clock: generous for
        # a person, low enough to stop a runaway client. Load tests raise it (see
        # docs/performance.md) - measuring a rate limiter is not measuring the app.
        "user": env("THROTTLE_USER_RATE", "5000/day"),
        # Credential endpoints are the ones worth rate limiting: they are the
        # only place an attacker gains anything by trying repeatedly.
        "login": "10/min",
        "register": "5/hour",
        "password_reset": "5/hour",
    },
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env_int("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", 30)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env_int("JWT_REFRESH_TOKEN_LIFETIME_DAYS", 7)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_OBTAIN_SERIALIZER": "apps.accounts.serializers.PillSyncTokenObtainPairSerializer",
}

#: One place for the release number: the API schema and the health probes report it.
API_VERSION = "1.0.0"

SPECTACULAR_SETTINGS = {
    "TITLE": "PillSync API",
    "DESCRIPTION": (
        "Intelligent medicine reminder and medication tracking platform. "
        "Authentication and roles, patient profiles, medicines and dosage schedules, "
        "reminders and notifications, prescription OCR, refill prediction, adherence "
        "analytics and dashboards."
    ),
    "VERSION": API_VERSION,
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": "/api/v1",
    # Several serializers expose a "role" field with different subsets of
    # UserRole. Naming them explicitly stops drf-spectacular inventing
    # Role965Enum / Role966Enum, which would leak into the generated client.
    "ENUM_NAME_OVERRIDES": {
        "UserRoleEnum": "apps.common.choices.UserRole.choices",
        "SignupRoleEnum": [
            ("PATIENT", "Patient"),
            ("CAREGIVER", "Caregiver"),
        ],
        "CaregiverRelationshipEnum": "apps.common.choices.CaregiverRelationship.choices",
        "MedicineCategoryEnum": "apps.common.choices.MedicineCategory.choices",
        "AssignmentStatusEnum": "apps.common.choices.AssignmentStatus.choices",
        "OcrJobStatusEnum": "apps.ocr.models.JobStatus.choices",
        "OcrItemStatusEnum": "apps.ocr.models.ItemStatus.choices",
        "OcrJobKindEnum": "apps.ocr.models.JobKind.choices",
        "RefillStatusEnum": "apps.refills.models.PredictionStatus.choices",
        "StockEventKindEnum": "apps.refills.models.StockEventKind.choices",
    },
    "TAGS": [
        {"name": "auth", "description": "Registration, login, tokens and passwords"},
        {"name": "users", "description": "The authenticated user and admin user management"},
        {"name": "caregiving", "description": "Caregiver to patient assignments"},
        {"name": "profiles", "description": "Patient profiles, conditions and emergency contacts"},
        {"name": "reference", "description": "Medicine catalogue and condition reference data"},
    ],
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# ---------------------------------------------------------------------------
# OAuth2 / social login
# ---------------------------------------------------------------------------
# The SPA obtains a Google ID token, posts it to /api/v1/auth/google/, and the
# backend verifies it against Google's public keys before issuing PillSync JWTs.

GOOGLE_OAUTH2_CLIENT_ID = env("GOOGLE_OAUTH2_CLIENT_ID")
GOOGLE_OAUTH2_CLIENT_SECRET = env("GOOGLE_OAUTH2_CLIENT_SECRET")

# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------

DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", "noreply@pillsync.local")
EMAIL_BACKEND = env("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")

# SMTP, used when EMAIL_BACKEND is the smtp backend (the production default once
# anything below is set). SendGrid needs only its API key: the SMTP user is the
# literal word "apikey" and the password is the key.
_SENDGRID = env("SENDGRID_API_KEY")
EMAIL_HOST = env("EMAIL_HOST", "smtp.sendgrid.net" if _SENDGRID else "localhost")
EMAIL_PORT = env_int("EMAIL_PORT", 587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", "apikey" if _SENDGRID else "")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", _SENDGRID)
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
# A dead mail server must fail a delivery, not hang a worker.
EMAIL_TIMEOUT = env_int("EMAIL_TIMEOUT_SECONDS", 10)
FRONTEND_BASE_URL = env("FRONTEND_BASE_URL", "http://localhost:5173")
PASSWORD_RESET_TIMEOUT = env_int("PASSWORD_RESET_TIMEOUT_SECONDS", 60 * 60 * 2)

# ---------------------------------------------------------------------------
# Notification providers
# ---------------------------------------------------------------------------
# Each is optional. Without credentials the corresponding provider falls back
# to logging the message, so the whole reminder pipeline runs in development
# and in CI without any third-party account.

FIREBASE_CREDENTIALS_PATH = env("FIREBASE_CREDENTIALS_PATH")
TWILIO_ACCOUNT_SID = env("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = env("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = env("TWILIO_FROM_NUMBER")
SENDGRID_API_KEY = env("SENDGRID_API_KEY")

# --- OCR -------------------------------------------------------------------
# The engine is a dotted path so tests inject a fake and a hosted engine (Google
# Vision, Azure Document Intelligence) can replace Tesseract without touching the
# pipeline - useful for handwritten prescriptions, which Tesseract reads poorly.
OCR_ENGINE = env("OCR_ENGINE", "apps.ocr.services.engines.TesseractEngine")
TESSERACT_CMD = env("TESSERACT_CMD")
# Off by default: a scan takes a few seconds, and a deployment without a Celery
# worker must still work. Turn on once a worker runs.
OCR_ASYNC = env_bool("OCR_ASYNC", False)
# ~8000 x 5000. A crafted file can be kilobytes on disk and gigabytes decoded.
OCR_MAX_IMAGE_PIXELS = env_int("OCR_MAX_IMAGE_PIXELS", 40_000_000)
# Scans never added to a medicine list are deleted after this long, images included.
OCR_RETENTION_DAYS = env_int("OCR_RETENTION_DAYS", 30)

# --- Refills -----------------------------------------------------------------
# Warn this many days before a medicine is predicted to run out. It is the time a
# patient needs to get to a pharmacy, so it is the buffer, not a forecast.
REFILL_LEAD_TIME_DAYS = env_int("REFILL_LEAD_TIME_DAYS", 5)
# Shared secret for POST /internal/run-jobs/, used where there is no Celery worker (a free
# hosting tier). Empty means the endpoint does not exist.
CRON_SECRET = env("CRON_SECRET")
SLOW_REQUEST_MS = env_int("SLOW_REQUEST_MS", 500)

# How far ahead dose events are materialised from schedules.
DOSE_HORIZON_DAYS = env_int("DOSE_HORIZON_DAYS", 14)

# ---------------------------------------------------------------------------
# Celery
# ---------------------------------------------------------------------------

CELERY_BROKER_URL = env("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_ALWAYS_EAGER = env_bool("CELERY_TASK_ALWAYS_EAGER", False)

# The reminder loop. Cadence matters: a dose reminder that arrives ten minutes
# late is a dose taken ten minutes late, so dispatch runs every minute, while
# generation and sweeping are cheap to do far less often.
CELERY_BEAT_SCHEDULE = {
    "dispatch-due-reminders": {
        "task": "reminders.dispatch_due_reminders",
        "schedule": crontab(minute="*"),
    },
    "sweep-overdue-doses": {
        "task": "reminders.sweep_overdue_doses",
        "schedule": crontab(minute="*/15"),
    },
    "generate-dose-events": {
        "task": "reminders.generate_dose_events",
        "schedule": crontab(hour=2, minute=0),
    },
    "notify-expiring-prescriptions": {
        "task": "reminders.notify_expiring_prescriptions",
        "schedule": crontab(hour=8, minute=0),
    },
    "recompute-refill-predictions": {
        "task": "refills.recompute_predictions",
        "schedule": crontab(hour=6, minute=0),
    },
    "purge-stale-ocr-jobs": {
        "task": "ocr.purge_stale_ocr_jobs",
        "schedule": crontab(hour=3, minute=30),
    },
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", "INFO")},
    "loggers": {
        "django.db.backends": {"level": "WARNING", "propagate": True},
        "apps": {"level": env("LOG_LEVEL", "INFO"), "propagate": True},
    },
}
