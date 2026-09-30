"""Time every request."""

from __future__ import annotations

import logging
import time

from django.conf import settings

from . import metrics

logger = logging.getLogger(__name__)

#: Endpoints that would swamp the figures without saying anything about the app.
IGNORED_PREFIXES = ("/static/", "/health/", "/favicon")


class RequestTimingMiddleware:
    """Adds a `Server-Timing` header, records the latency, logs the slow ones."""

    def __init__(self, get_response):
        self.get_response = get_response
        self.slow_ms = getattr(settings, "SLOW_REQUEST_MS", 500)

    def __call__(self, request):
        started = time.perf_counter()
        response = self.get_response(request)
        elapsed = (time.perf_counter() - started) * 1000

        response["Server-Timing"] = f"app;dur={elapsed:.1f}"

        if not request.path.startswith(IGNORED_PREFIXES):
            # The route template, not the URL: /medicines/<uuid>/ must be one
            # bucket, not one per medicine.
            match = getattr(request, "resolver_match", None)
            route = match.route if match and match.route else "unmatched"
            metrics.store.record(route, request.method, response.status_code, elapsed)
            if elapsed >= self.slow_ms:
                logger.warning(
                    "Slow request: %s %s took %.0f ms (status %s)",
                    request.method,
                    route,
                    elapsed,
                    response.status_code,
                )
        return response
