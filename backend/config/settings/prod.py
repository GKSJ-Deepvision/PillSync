"""Deployed settings.

Nothing here has a usable default: if a required variable is missing the
process refuses to start rather than silently running insecurely.
"""

from config.settings.base import *  # noqa: F403
from config.settings.base import env, env_bool, env_list

DEBUG = False

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS")
if not ALLOWED_HOSTS:
    raise RuntimeError("ALLOWED_HOSTS must be set in production.")

SECRET_KEY = env("SECRET_KEY")
if not SECRET_KEY or SECRET_KEY.startswith("insecure-"):
    raise RuntimeError("SECRET_KEY must be set to a real value in production.")

# HTTPS everywhere. USE_HTTPS=false exists for exactly one purpose: running the
# production stack on a laptop over plain http to smoke-test it. Every real
# deployment terminates TLS in front of the app and leaves this on.
USE_HTTPS = env_bool("USE_HTTPS", True)

SECURE_SSL_REDIRECT = USE_HTTPS
# Load balancers probe over plain http from inside the network; redirecting them
# would mark a healthy instance as down.
SECURE_REDIRECT_EXEMPT = [r"^health/"]
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 365 if USE_HTTPS else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = USE_HTTPS
SECURE_HSTS_PRELOAD = USE_HTTPS
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"

SESSION_COOKIE_SECURE = USE_HTTPS
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = USE_HTTPS
CSRF_COOKIE_HTTPONLY = True

# Where the SPA is served from, for CORS and CSRF. Same-origin deployments (nginx
# in front of both) need neither, but a split deployment (static site plus API on
# another host) does.
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "") or CORS_ALLOWED_ORIGINS

# SQLite is a development convenience. In production it would silently lose data
# on a container restart and cannot be shared by the web and worker processes.
if DATABASES["default"]["ENGINE"].endswith("sqlite3"):  # noqa: F405
    raise RuntimeError("Production needs PostgreSQL: set DATABASE_URL or POSTGRES_HOST.")

X_FRAME_OPTIONS = "DENY"

# Real SMTP only when a mail server is actually configured. Otherwise messages go
# to the console: reminders and caregiver alerts then "send" but reach nobody, so
# say so loudly at startup rather than letting a deployment believe it is
# delivering.
_MAIL_CONFIGURED = bool(EMAIL_HOST_PASSWORD) or EMAIL_HOST != "localhost"  # noqa: F405
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    (
        "django.core.mail.backends.smtp.EmailBackend"
        if _MAIL_CONFIGURED
        else "django.core.mail.backends.console.EmailBackend"
    ),
)
if EMAIL_BACKEND.endswith("console.EmailBackend"):
    import warnings

    warnings.warn(
        "No mail server is configured (set SENDGRID_API_KEY or EMAIL_HOST): email reminders "
        "and caregiver alerts will be printed to the log, not delivered.",
        stacklevel=1,
    )
