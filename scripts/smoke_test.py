"""Smoke-test a running PillSync deployment, from the outside, over HTTP.

    python scripts/smoke_test.py http://localhost:8088
    python scripts/smoke_test.py https://pillsync.example.com

Uses only the standard library, so it runs anywhere - a laptop, CI, a jump box.
It checks that the deployed system works as one piece: the web tier serves the
app, the proxy reaches the API, the API reaches its database, an account can be
created, a prescription can be scanned and turned into reminders, and the
analytics endpoints answer. It creates one throwaway patient and leaves it behind
(use a staging database, not production).

Exit status is 0 only if every check passes.
"""

from __future__ import annotations

import argparse
import json
import secrets
import struct
import sys
import time
import urllib.error
import urllib.request
import uuid
import zlib

RESULTS: list[tuple[bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> bool:
    RESULTS.append((ok, name))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  ({detail})" if detail and not ok else ""))
    return ok


class Client:
    def __init__(self, base: str):
        self.base = base.rstrip("/")
        self.token: str | None = None

    def request(self, method, path, body=None, headers=None, raw=None, timeout=60):
        data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
        req = urllib.request.Request(self.base + path, data=data, method=method)
        if body is not None:
            req.add_header("Content-Type", "application/json")
        if self.token:
            req.add_header("Authorization", f"Bearer {self.token}")
        for key, value in (headers or {}).items():
            req.add_header(key, value)
        started = time.perf_counter()
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                payload, status, hdrs = response.read(), response.status, response.headers
        except urllib.error.HTTPError as exc:
            payload, status, hdrs = exc.read(), exc.code, exc.headers
        elapsed = (time.perf_counter() - started) * 1000
        try:
            parsed = json.loads(payload) if payload else None
        except ValueError:
            parsed = None
        return status, parsed, payload, hdrs, elapsed


def blank_png(width=400, height=300) -> bytes:
    """A valid white PNG, built by hand so the script needs no imaging library."""

    def chunk(kind: bytes, data: bytes) -> bytes:
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    row = b"\x00" + b"\xff\xff\xff" * width
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(row * height))
        + chunk(b"IEND", b"")
    )


def multipart(fields: dict[str, str], file_field: str, filename: str, content: bytes):
    boundary = uuid.uuid4().hex
    parts = []
    for name, value in fields.items():
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        )
    parts.append(
        (
            f'--{boundary}\r\nContent-Disposition: form-data; name="{file_field}"; '
            f'filename="{filename}"\r\nContent-Type: image/png\r\n\r\n'
        ).encode()
        + content
        + b"\r\n"
    )
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


def run(base: str) -> int:
    c = Client(base)
    print(f"Smoke test against {c.base}\n")

    print("Web tier")
    status, _, body, hdrs, _ = c.request("GET", "/")
    check("the app is served", status == 200 and b'id="root"' in body, f"status {status}")
    check("index.html is not cached", "no-cache" in (hdrs.get("Cache-Control") or ""))
    status, *_ = c.request("GET", "/some/deep/link")
    check("client-side routes fall back to the app", status == 200, f"status {status}")

    print("\nAPI and database")
    status, data, *_ = c.request("GET", "/health/")
    check("liveness probe", status == 200 and data and data["status"] == "ok", f"status {status}")
    status, data, *_ = c.request("GET", "/health/ready/")
    check("readiness probe (database reachable)", status == 200, f"status {status}")
    status, *_ = c.request("GET", "/api/v1/refills/")
    check("protected endpoints refuse anonymous callers", status == 401, f"status {status}")
    status, *_ = c.request("GET", "/admin/login/")
    check("the admin is reachable through the proxy", status == 200, f"status {status}")

    print("\nAccount")
    email = f"smoke.{secrets.token_hex(4)}@example.com"
    password = secrets.token_urlsafe(16)
    status, data, *_ = c.request(
        "POST",
        "/api/v1/auth/register/",
        {
            "email": email,
            "full_name": "Smoke Test",
            "password": password,
            "password_confirm": password,
            "role": "PATIENT",
        },
    )
    check("registration", status == 201, f"status {status}: {data}")
    status, data, *_ = c.request("POST", "/api/v1/auth/login/", {"email": email, "password": password})
    if not check("login returns a token", status == 200 and data and "access" in data, f"status {status}"):
        return finish()
    c.token = data["access"]

    status, data, *_ = c.request("GET", "/api/v1/profiles/patients/")
    profile = (data or {}).get("results", [{}])[0].get("id")
    check("the patient has a profile", bool(profile), f"status {status}")
    if not profile:
        return finish()

    print("\nPrescription to reminders")
    status, data, *_ = c.request(
        "POST",
        "/api/v1/ocr/jobs/parse-text/",
        {
            "patient": profile,
            "text": "Dr. Smoke Test\nRx\n1. Tab Metformin 500 mg 1-0-1 x 30 days\n",
        },
    )
    items = (data or {}).get("items", [])
    check("typed prescription is parsed", status == 201 and len(items) == 1, f"status {status}")
    if not items:
        return finish()
    check(
        "the medicine is matched to the catalogue",
        bool(items[0]["reference"]),
        "is the catalogue seeded? (seed_reference_data)",
    )

    status, data, *_ = c.request("POST", f"/api/v1/ocr/jobs/{data['id']}/confirm/", {})
    check("confirming creates the medicine", status == 200 and len(data["medicines"]) == 1, f"status {status}")
    status, data, *_ = c.request("GET", "/api/v1/doses/upcoming/")
    check("reminders were scheduled", status == 200, f"status {status}")

    body, content_type = multipart({"patient": profile}, "image", "rx.png", blank_png())
    status, data, *_, elapsed = c.request(
        "POST", "/api/v1/ocr/jobs/", raw=body, headers={"Content-Type": content_type}, timeout=120
    )
    check(
        "an image upload passes the proxy and is read by the real OCR engine",
        status == 201 and data and data["status"] == "COMPLETED" and data["engine"] == "tesseract",
        f"status {status}: {(data or {}).get('error', data)}",
    )

    print("\nAnalytics")
    for name, path in [
        ("refill forecast", "/api/v1/refills/"),
        ("adherence summary", "/api/v1/adherence/summary/"),
        ("dashboard", "/api/v1/analytics/dashboard/"),
    ]:
        status, _, _, hdrs, elapsed = c.request("GET", path)
        check(f"{name} answers", status == 200, f"status {status}")
    status, *_ = c.request("GET", "/api/v1/analytics/admin/")
    check("admin analytics is forbidden to a patient", status == 403, f"status {status}")

    status, *_, hdrs, elapsed = c.request("GET", "/api/v1/analytics/dashboard/")
    check("responses carry a Server-Timing header", "Server-Timing" in hdrs)

    return finish()


def finish() -> int:
    failed = [name for ok, name in RESULTS if not ok]
    print(f"\n{len(RESULTS) - len(failed)} of {len(RESULTS)} checks passed")
    if failed:
        print("Failed:\n  - " + "\n  - ".join(failed))
    return 1 if failed else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("base_url", help="e.g. http://localhost:8088")
    sys.exit(run(parser.parse_args().base_url))
