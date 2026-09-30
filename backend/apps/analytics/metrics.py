"""Request latency, kept in memory.

The specification asks for "system performance metrics". Without an external
monitoring stack the honest answer is a rolling window of the last few thousand
requests, summarised as percentiles. It is per process: behind several gunicorn
workers each one keeps its own window, so the figures are a sample of traffic,
not a census. A real deployment would export to Prometheus or a hosted APM; the
middleware's Server-Timing header and slow-request log line already carry
what such a tool would need.
"""

from __future__ import annotations

import math
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass

WINDOW = 5000


@dataclass(frozen=True)
class Sample:
    route: str
    method: str
    status: int
    ms: float


class LatencyStore:
    def __init__(self, size: int = WINDOW):
        self._samples: deque[Sample] = deque(maxlen=size)
        self._lock = threading.Lock()
        self.started_at = time.time()

    def record(self, route: str, method: str, status: int, ms: float) -> None:
        with self._lock:
            self._samples.append(Sample(route, method, status, ms))

    def clear(self) -> None:
        with self._lock:
            self._samples.clear()

    def snapshot(self) -> list[Sample]:
        with self._lock:
            return list(self._samples)


def percentile(values: list[float], q: float) -> float | None:
    """Nearest-rank percentile; None when there is nothing to measure."""
    if not values:
        return None
    ordered = sorted(values)
    rank = max(1, math.ceil(q / 100 * len(ordered)))
    return round(ordered[rank - 1], 1)


def summarise(samples: list[Sample], *, top: int = 10) -> dict:
    times = [s.ms for s in samples]
    server_errors = sum(1 for s in samples if s.status >= 500)

    by_route: dict[str, list[Sample]] = defaultdict(list)
    for s in samples:
        by_route[f"{s.method} {s.route}"].append(s)

    routes = []
    for name, rows in by_route.items():
        ms = [r.ms for r in rows]
        routes.append(
            {
                "route": name,
                "count": len(rows),
                "p50_ms": percentile(ms, 50),
                "p95_ms": percentile(ms, 95),
                "max_ms": round(max(ms), 1),
                "errors": sum(1 for r in rows if r.status >= 500),
            }
        )
    routes.sort(key=lambda r: -(r["p95_ms"] or 0))

    return {
        "requests": len(samples),
        "p50_ms": percentile(times, 50),
        "p95_ms": percentile(times, 95),
        "p99_ms": percentile(times, 99),
        "mean_ms": round(sum(times) / len(times), 1) if times else None,
        "server_error_rate": round(100 * server_errors / len(samples), 2) if samples else None,
        "slowest_routes": routes[:top],
        "window": WINDOW,
    }


store = LatencyStore()
