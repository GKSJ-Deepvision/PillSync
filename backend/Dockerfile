# PillSync backend image.
FROM python:3.11-slim AS base

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
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements/ requirements/
RUN pip install --upgrade pip && pip install -r requirements/base.txt

COPY backend/ .
COPY ml/ /app/ml/

RUN adduser --disabled-password --gecos "" appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "config.main:app", "--host", "0.0.0.0", "--port", "8000"]
