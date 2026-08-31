"""Health check endpoints.

`GET /api/v1/health` — liveness only, no dependencies touched.
`GET /api/v1/health/db` — round-trips a `SELECT 1` through the async engine.
"""

from __future__ import annotations

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from config.database import ping_database

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def liveness() -> dict:
    return {"success": True, "data": {"status": "ok"}}


@router.get("/db")
async def database_health() -> JSONResponse:
    is_healthy = await ping_database()
    if is_healthy:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"success": True, "data": {"database": "reachable"}},
        )
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "success": False,
            "error": {
                "code": "DATABASE_UNAVAILABLE",
                "message": "Could not reach the database.",
                "details": None,
            },
        },
    )
