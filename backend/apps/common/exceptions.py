"""A single, predictable error shape for the whole API.

DRF's default handler returns a different JSON shape depending on which
exception was raised. The frontend then needs a special case per endpoint. This
normalises everything to:

    {"error": {"code": "validation_error", "message": "...", "details": {...}}}
"""

from __future__ import annotations

import logging

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.db import IntegrityError
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)

CODES = {
    status.HTTP_400_BAD_REQUEST: "validation_error",
    status.HTTP_401_UNAUTHORIZED: "not_authenticated",
    status.HTTP_403_FORBIDDEN: "permission_denied",
    status.HTTP_404_NOT_FOUND: "not_found",
    status.HTTP_405_METHOD_NOT_ALLOWED: "method_not_allowed",
    status.HTTP_409_CONFLICT: "conflict",
    status.HTTP_429_TOO_MANY_REQUESTS: "throttled",
}


def pillsync_exception_handler(exc, context):
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, DjangoPermissionDenied):
        exc = exceptions.PermissionDenied()
    elif isinstance(exc, IntegrityError):
        logger.warning("Integrity error in %s: %s", context.get("view"), exc)
        exc = exceptions.ValidationError(
            {"detail": "That record conflicts with one that already exists."}
        )

    response = drf_exception_handler(exc, context)
    if response is None:
        # Anything unhandled is a bug: log it with the stack, and never leak the
        # internals to the client.
        logger.exception("Unhandled exception in %s", context.get("view"))
        return Response(
            {
                "error": {
                    "code": "server_error",
                    "message": "Something went wrong. The team has been notified.",
                    "details": {},
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    detail = response.data
    message = "Request failed."
    details: dict = {}

    if isinstance(detail, dict):
        raw = detail.get("detail")
        if isinstance(raw, str):
            message = raw
        else:
            details = detail
            message = "The request could not be processed. See details."
    elif isinstance(detail, list):
        details = {"non_field_errors": detail}
        message = "The request could not be processed. See details."

    response.data = {
        "error": {
            "code": CODES.get(response.status_code, "error"),
            "message": message,
            "details": details,
        }
    }
    return response
