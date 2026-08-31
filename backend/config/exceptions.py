"""Global exception handlers and the standard error envelope.

Every error response — validation failure, unhandled exception, HTTP error —
comes back in the same shape so the frontend only has to handle one format:

    {
        "success": false,
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "...",
            "details": [...]
        }
    }
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("pillsync")


def error_envelope(code: str, message: str, details: object | None = None) -> dict:
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
    }


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=error_envelope(code=f"HTTP_{exc.status_code}", message=str(exc.detail)),
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_envelope(
            code="VALIDATION_ERROR",
            message="One or more fields failed validation.",
            details=exc.errors(),
        ),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception while processing %s %s", request.method, request.url)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_envelope(
            code="INTERNAL_SERVER_ERROR",
            message="Something went wrong. Please try again later.",
        ),
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
