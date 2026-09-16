"""Production settings for PillSync."""

import os
from .base import *  # noqa: F403

DEBUG = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
    }
}

if os.getenv("POSTGRES_DB"):
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "pillsync"),
        "USER": os.getenv("POSTGRES_USER", "pillsync"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", ""),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
