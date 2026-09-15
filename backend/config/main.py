"""PillSync backend — FastAPI entrypoint.

Run locally from the ``backend/`` directory:

    pip install -r requirements/dev.txt
    uvicorn config.main:app --reload --port 8000

The frontend calls this via ``VITE_API_BASE_URL`` (see
``frontend/.env.example``), which already defaults to
``http://localhost:8000/api``.

Only Module 6 (AI Refill Prediction Engine) is implemented here today; other
apps under ``backend/apps/`` are still the scaffolding described in their
own READMEs. Add their routers the same way as ``refills.router`` below as
they're built out.
"""

from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.ocr.router import router as ocr_router
from apps.refills.router import router as refills_router

load_dotenv()

app = FastAPI(
    title="PillSync API",
    description="Python backend for PillSync — currently serving Module 6 (AI Refill Prediction Engine).",
    version="1.0.0",
)

# Comma-separated list of allowed browser origins, e.g.
# "http://localhost:5173,https://app.pillsync.example". Keep both local
# hostnames enabled because browsers and dev servers can resolve localhost
# differently on Windows.
_configured_origins = os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
_origins = {
    origin.strip()
    for origin in [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        *_configured_origins,
    ]
    if origin.strip()
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(_origins),
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1):517\d$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr_router)
app.include_router(refills_router)


@app.get("/api/health")
def root_health() -> dict:
    return {"status": "ok", "service": "pillsync-backend"}
