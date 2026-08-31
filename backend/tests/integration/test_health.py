"""Integration tests: exercise the real app over HTTP (ASGI), against the
real `DATABASE_URL` — a local Postgres in dev, the `postgres` service
container in CI. See `backend/README.md` for how to run Postgres locally.
"""

from __future__ import annotations

import pytest

pytestmark = pytest.mark.integration


async def test_liveness(client):
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["status"] == "ok"


async def test_database_health(client):
    response = await client.get("/api/v1/health/db")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["database"] == "reachable"


async def test_root_endpoint(client):
    response = await client.get("/")

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["service"] == "PillSync"
    assert body["data"]["docs"] == "/docs"


async def test_openapi_schema_is_served(client):
    response = await client.get("/api/v1/openapi.json")

    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["title"] == "PillSync"


async def test_unknown_route_returns_standard_error_envelope(client):
    response = await client.get("/api/v1/this-route-does-not-exist")

    assert response.status_code == 404
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "HTTP_404"
