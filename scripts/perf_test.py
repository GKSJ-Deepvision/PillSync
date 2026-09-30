"""Measure API latency and throughput under concurrent load.

    python scripts/perf_test.py http://localhost:8088 --email asha.rao@pillsync.example \\
        --password ... --users 10 --duration 20

Standard library only. It signs in once, then has `--users` threads hammer a
realistic mix of read endpoints (the dashboard, refills, adherence, today's
doses, the medicine list) for `--duration` seconds, and reports p50/p95/p99
latency, requests per second and the error rate - overall and per endpoint.

What this is and is not: it measures the deployed API from one machine, with the
client and server usually on the same host, so it under-counts network time and
competes with the server for CPU. It is good for finding slow endpoints and for
before/after comparisons, not for capacity planning. See docs/performance.md.
"""

from __future__ import annotations

import argparse
import json
import statistics
import sys
import threading
import time
import urllib.error
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

ENDPOINTS = [
    ("dashboard", "/api/v1/analytics/dashboard/", 4),
    ("today's doses", "/api/v1/doses/today/", 4),
    ("refill forecast", "/api/v1/refills/", 3),
    ("adherence (30d)", "/api/v1/adherence/summary/?days=30", 3),
    ("medicine list", "/api/v1/medicines/", 2),
    ("adherence report", "/api/v1/adherence/report/?period=weekly", 1),
]


ADMIN_ENDPOINTS = [
    ("platform analytics", "/api/v1/analytics/admin/", 3),
    ("api performance", "/api/v1/analytics/performance/", 1),
]


def post_json(base, path, body):
    req = urllib.request.Request(
        base + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}
    )
    started = time.perf_counter()
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read()), (time.perf_counter() - started) * 1000


def percentile(values, q):
    if not values:
        return None
    ordered = sorted(values)
    return ordered[max(1, -(-int(q * len(ordered)) // 100)) - 1] if q < 100 else ordered[-1]


def worker(base, token, deadline, samples, lock, weighted):
    index = 0
    while time.perf_counter() < deadline:
        name, path = weighted[index % len(weighted)]
        index += 1
        req = urllib.request.Request(base + path, headers={"Authorization": f"Bearer {token}"})
        started = time.perf_counter()
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                response.read()
                status = response.status
        except urllib.error.HTTPError as exc:
            exc.read()
            status = exc.code
        except Exception:  # noqa: BLE001 - a timeout or reset is a failed request
            status = 0
        elapsed = (time.perf_counter() - started) * 1000
        with lock:
            samples.append((name, status, elapsed))


def summarise(samples, wall):
    def row(items):
        times = [t for _n, _s, t in items]
        errors = sum(1 for _n, s, _t in items if not 200 <= s < 400)
        throttled = sum(1 for _n, s, _t in items if s == 429)
        return {
            "requests": len(items),
            "p50_ms": round(percentile(times, 50), 1) if times else None,
            "p95_ms": round(percentile(times, 95), 1) if times else None,
            "p99_ms": round(percentile(times, 99), 1) if times else None,
            "max_ms": round(max(times), 1) if times else None,
            "mean_ms": round(statistics.fmean(times), 1) if times else None,
            "error_rate_percent": round(100 * errors / len(items), 2) if items else None,
            "throttled": throttled,
        }

    per_endpoint = defaultdict(list)
    for sample in samples:
        per_endpoint[sample[0]].append(sample)
    overall = row(samples)
    overall["requests_per_second"] = round(len(samples) / wall, 1) if wall else None
    return {"overall": overall, "endpoints": {n: row(s) for n, s in per_endpoint.items()}}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("base_url")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--users", type=int, default=10, help="concurrent clients")
    parser.add_argument("--duration", type=int, default=20, help="seconds")
    parser.add_argument("--json", action="store_true", help="print JSON only")
    parser.add_argument(
        "--admin", action="store_true", help="test the administrator endpoints instead (use an admin login)"
    )
    args = parser.parse_args()
    base = args.base_url.rstrip("/")

    # Login is measured on its own: password hashing is deliberately slow and
    # would swamp the read latencies if mixed in.
    logins = []
    token = None
    for _ in range(3):
        data, ms = post_json(base, "/api/v1/auth/login/", {"email": args.email, "password": args.password})
        token = data["access"]
        logins.append(ms)

    mix = ADMIN_ENDPOINTS if args.admin else ENDPOINTS
    weighted = [(n, p) for n, p, weight in mix for _ in range(weight)]
    samples: list[tuple[str, int, float]] = []
    lock = threading.Lock()

    # Warm up so the first cold request (imports, connection setup) is not counted.
    warm_deadline = time.perf_counter() + 2
    worker(base, token, warm_deadline, [], lock, weighted)

    started = time.perf_counter()
    deadline = started + args.duration
    with ThreadPoolExecutor(max_workers=args.users) as pool:
        for i in range(args.users):
            # Offset each thread's position in the mix so they do not march in step.
            rotated = weighted[i:] + weighted[:i]
            pool.submit(worker, base, token, deadline, samples, lock, rotated)
    wall = time.perf_counter() - started

    report = summarise(samples, wall)
    report["config"] = {"users": args.users, "duration_s": args.duration}
    report["login_ms"] = {"samples": [round(x, 1) for x in logins], "median": round(statistics.median(logins), 1)}

    if report["overall"]["throttled"]:
        print(
            f"\nINVALID RUN: {report['overall']['throttled']} requests were rate limited (429). "
            "The server answered them instantly without doing the work, so every figure below is "
            "flattered. Raise THROTTLE_USER_RATE on the server under test and run again.\n",
            file=sys.stderr,
        )
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        o = report["overall"]
        print(f"\n{args.users} concurrent users for {args.duration}s against {base}\n")
        print(f"  requests        {o['requests']}  ({o['requests_per_second']}/s)")
        print(f"  latency         p50 {o['p50_ms']} ms   p95 {o['p95_ms']} ms   p99 {o['p99_ms']} ms   max {o['max_ms']} ms")
        print(f"  errors          {o['error_rate_percent']}%")
        print(f"  login (median)  {report['login_ms']['median']} ms\n")
        print(f"  {'endpoint':<20}{'requests':>9}{'p50':>9}{'p95':>9}{'p99':>9}{'errors':>9}")
        for name, e in sorted(report["endpoints"].items(), key=lambda kv: -kv[1]["p95_ms"]):
            print(f"  {name:<20}{e['requests']:>9}{e['p50_ms']:>9}{e['p95_ms']:>9}{e['p99_ms']:>9}{e['error_rate_percent']:>8}%")
    clean = report["overall"]["error_rate_percent"] == 0
    return 0 if clean else 1


if __name__ == "__main__":
    sys.exit(main())
