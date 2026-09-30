# PillSync backend image.
#
#   docker build -t pillsync-backend .                    # production (the default)
#   docker build --target dev -t pillsync-backend-dev .   # development, runserver
#
# Tesseract is installed at the OS level because pytesseract shells out to it.

# --- Shared base: OS packages and Python dependencies ---------------------------
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        tesseract-ocr \
        libtesseract-dev \
        libgl1 \
        libglib2.0-0 \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/ requirements/
RUN pip install --upgrade pip && pip install -r requirements/prod.txt

# --- Development: source is bind-mounted by docker compose, auto-reloading ------
FROM base AS dev

RUN pip install -r requirements/dev.txt
COPY . .
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# --- Production (last stage, so it is what a plain `docker build` produces) -----
FROM base AS production

COPY . .

# Collected at build time so the image is self-contained and WhiteNoise can serve
# the admin's static files with no volume. The build has no real secrets, so it
# uses throwaway values that never leave this layer.
RUN DJANGO_SETTINGS_MODULE=config.settings.prod \
    SECRET_KEY=build-only-not-a-real-secret-key-0000000000 \
    ALLOWED_HOSTS=build \
    POSTGRES_HOST=build-only \
    python manage.py collectstatic --noinput

# chmod here, not in git: an exec bit does not survive a Windows checkout.
RUN chmod +x /app/scripts/entrypoint.sh \
    && adduser --disabled-password --gecos "" appuser \
    && mkdir -p /app/media \
    && chown -R appuser:appuser /app/media /app/staticfiles
USER appuser

ENV DJANGO_SETTINGS_MODULE=config.settings.prod \
    PORT=8000 \
    WEB_CONCURRENCY=3

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT}/health/" || exit 1

ENTRYPOINT ["/app/scripts/entrypoint.sh"]

# Workers are sync because the app does short, database-bound requests; the one
# slow call (OCR) is bounded by its own timeout, so the worker timeout leaves
# room for it. Override the count with WEB_CONCURRENCY.
CMD ["sh", "-c", "exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT} --workers ${WEB_CONCURRENCY} --timeout 120 --access-logfile - --error-logfile -"]
