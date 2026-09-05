"""Local development settings.

Also used by CI: the pipeline exports DATABASE_URL pointing at its PostgreSQL
service container, so the same module runs against both SQLite locally and
PostgreSQL in the pipeline.
"""

from config.settings.base import *  # noqa: F403
from config.settings.base import env_bool

DEBUG = env_bool("DEBUG", True)

ALLOWED_HOSTS = ["*"]

# Every origin is allowed locally so a Vite dev server on any port just works.
CORS_ALLOW_ALL_ORIGINS = True

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Hashing is deliberately slow in production. In tests that cost dominates the
# run time and buys nothing, so use the fast hasher when DEBUG is on.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]  # noqa: S105

CELERY_TASK_ALWAYS_EAGER = True

# WhiteNoise serves the collected static bundle in production. Locally there is
# no bundle to serve, and its warning on every request is just noise.
MIDDLEWARE = [m for m in MIDDLEWARE if "whitenoise" not in m]  # noqa: F405
