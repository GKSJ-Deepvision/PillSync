"""Integration tests: reminder scheduling + Taken/Missed/Snooze actions.

Runs against the real app over HTTP (the `client` fixture) and the real
`DATABASE_URL`. Unlike the SQLite `db_session` fixture, there's no
per-test rollback here — each test creates its own `User`/`Medicine` and
tears them down (`ON DELETE CASCADE` handles reminders/adherence logs) so
tests don't interfere with each other or leave data behind.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator

import pytest

from apps.accounts.models import User
from apps.common.enums import UserRole
from apps.medications.models import Medicine
from config.database import session_scope

pytestmark = pytest.mark.integration


@pytest.fixture
async def owned_medicine() -> AsyncGenerator[dict, None]:
    """Creates a real User + Medicine row, yields their IDs, deletes both after."""

    async with session_scope() as db:
        user = User(
            email=f"reminder-itest-{uuid.uuid4().hex[:10]}@example.com",
            hashed_password="not-a-real-hash",
            full_name="Reminder Test Patient",
            role=UserRole.PATIENT,
        )
        db.add(user)
        await db.flush()

        medicine = Medicine(
            user_id=user.id,
            name="Metformin",
            dosage="500mg",
            total_quantity=60,
            remaining_quantity=60,
        )
        db.add(medicine)
        await db.flush()
        await db.refresh(user)
        await db.refresh(medicine)
        user_id, medicine_id = user.id, medicine.id

    yield {"user_id": str(user_id), "medicine_id": str(medicine_id)}

    async with session_scope() as db:
        db_user = await db.get(User, user_id)
        if db_user is not None:
            await db.delete(db_user)  # cascades to medicines -> reminders -> adherence_logs


async def test_create_reminder_once_daily(client, owned_medicine):
    response = await client.post(
        "/api/v1/reminders",
        json={
            "medicine_id": owned_medicine["medicine_id"],
            "user_id": owned_medicine["user_id"],
            "frequency": "ONCE_DAILY",
            "times": ["08:00:00"],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert len(body) == 1
    assert body[0]["scheduled_time"] == "08:00:00"
    assert body[0]["frequency"] == "ONCE_DAILY"
    assert body[0]["is_active"] is True
    assert body[0]["next_occurrence"] is not None


async def test_create_twice_daily_creates_two_reminders(client, owned_medicine):
    response = await client.post(
        "/api/v1/reminders",
        json={
            "medicine_id": owned_medicine["medicine_id"],
            "user_id": owned_medicine["user_id"],
            "frequency": "TWICE_DAILY",
            "times": ["08:00:00", "20:00:00"],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert {r["scheduled_time"] for r in body} == {"08:00:00", "20:00:00"}
    assert all(r["frequency"] == "TWICE_DAILY" for r in body)


@pytest.mark.parametrize(
    "payload_overrides",
    [
        {"frequency": "TWICE_DAILY", "times": ["08:00:00"]},  # wrong count
        {"frequency": "WEEKLY", "times": ["08:00:00"]},  # missing day_of_week
        {"frequency": "CUSTOM", "times": ["08:00:00"]},  # missing interval_days
    ],
)
async def test_create_reminder_validation_errors_return_422(
    client, owned_medicine, payload_overrides
):
    payload = {
        "medicine_id": owned_medicine["medicine_id"],
        "user_id": owned_medicine["user_id"],
        **payload_overrides,
    }
    response = await client.post("/api/v1/reminders", json=payload)

    assert response.status_code == 422
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


async def test_create_reminder_for_unowned_medicine_returns_404(client, owned_medicine):
    response = await client.post(
        "/api/v1/reminders",
        json={
            "medicine_id": str(uuid.uuid4()),
            "user_id": owned_medicine["user_id"],
            "frequency": "ONCE_DAILY",
            "times": ["08:00:00"],
        },
    )

    assert response.status_code == 404


async def test_list_reminders_filters_by_user_and_medicine(client, owned_medicine):
    await client.post(
        "/api/v1/reminders",
        json={
            "medicine_id": owned_medicine["medicine_id"],
            "user_id": owned_medicine["user_id"],
            "frequency": "ONCE_DAILY",
            "times": ["09:00:00"],
        },
    )

    response = await client.get(
        "/api/v1/reminders",
        params={"user_id": owned_medicine["user_id"], "medicine_id": owned_medicine["medicine_id"]},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["scheduled_time"] == "09:00:00"


async def test_get_unknown_reminder_returns_404(client):
    response = await client.get(f"/api/v1/reminders/{uuid.uuid4()}")
    assert response.status_code == 404


async def test_update_reminder_scheduled_time(client, owned_medicine):
    create = await client.post(
        "/api/v1/reminders",
        json={
            "medicine_id": owned_medicine["medicine_id"],
            "user_id": owned_medicine["user_id"],
            "frequency": "ONCE_DAILY",
            "times": ["09:00:00"],
        },
    )
    reminder_id = create.json()[0]["id"]

    response = await client.patch(
        f"/api/v1/reminders/{reminder_id}", json={"scheduled_time": "07:30:00"}
    )

    assert response.status_code == 200
    assert response.json()["scheduled_time"] == "07:30:00"


async def test_deactivate_reminder_clears_next_occurrence(client, owned_medicine):
    create = await client.post(
        "/api/v1/reminders",
        json={
            "medicine_id": owned_medicine["medicine_id"],
            "user_id": owned_medicine["user_id"],
            "frequency": "ONCE_DAILY",
            "times": ["09:00:00"],
        },
    )
    reminder_id = create.json()[0]["id"]

    response = await client.post(f"/api/v1/reminders/{reminder_id}/deactivate")

    assert response.status_code == 200
    body = response.json()
    assert body["is_active"] is False
    assert body["next_occurrence"] is None


async def test_taken_action_creates_adherence_log(client, owned_medicine):
    create = await client.post(
        "/api/v1/reminders",
        json={
            "medicine_id": owned_medicine["medicine_id"],
            "user_id": owned_medicine["user_id"],
            "frequency": "ONCE_DAILY",
            "times": ["09:00:00"],
        },
    )
    reminder_id = create.json()[0]["id"]

    response = await client.post(
        f"/api/v1/reminders/{reminder_id}/actions", json={"action": "TAKEN"}
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "TAKEN"
    assert body["reminder_id"] == reminder_id


async def test_missed_action_creates_adherence_log(client, owned_medicine):
    create = await client.post(
        "/api/v1/reminders",
        json={
            "medicine_id": owned_medicine["medicine_id"],
            "user_id": owned_medicine["user_id"],
            "frequency": "ONCE_DAILY",
            "times": ["09:00:00"],
        },
    )
    reminder_id = create.json()[0]["id"]

    response = await client.post(
        f"/api/v1/reminders/{reminder_id}/actions", json={"action": "MISSED"}
    )

    assert response.status_code == 201
    assert response.json()["status"] == "MISSED"


async def test_snooze_action_sets_snoozed_until_and_next_occurrence(client, owned_medicine):
    create = await client.post(
        "/api/v1/reminders",
        json={
            "medicine_id": owned_medicine["medicine_id"],
            "user_id": owned_medicine["user_id"],
            "frequency": "ONCE_DAILY",
            "times": ["09:00:00"],
        },
    )
    reminder_id = create.json()[0]["id"]

    action_response = await client.post(
        f"/api/v1/reminders/{reminder_id}/actions",
        json={"action": "SNOOZE", "snooze_minutes": 15},
    )
    assert action_response.status_code == 201
    assert action_response.json()["status"] == "SNOOZED"

    reminder_response = await client.get(f"/api/v1/reminders/{reminder_id}")
    body = reminder_response.json()
    assert body["snoozed_until"] is not None
    assert body["next_occurrence"] == body["snoozed_until"]


async def test_taken_action_clears_a_pending_snooze(client, owned_medicine):
    create = await client.post(
        "/api/v1/reminders",
        json={
            "medicine_id": owned_medicine["medicine_id"],
            "user_id": owned_medicine["user_id"],
            "frequency": "ONCE_DAILY",
            "times": ["09:00:00"],
        },
    )
    reminder_id = create.json()[0]["id"]

    await client.post(f"/api/v1/reminders/{reminder_id}/actions", json={"action": "SNOOZE"})
    await client.post(f"/api/v1/reminders/{reminder_id}/actions", json={"action": "TAKEN"})

    reminder_response = await client.get(f"/api/v1/reminders/{reminder_id}")
    assert reminder_response.json()["snoozed_until"] is None


async def test_action_on_unknown_reminder_returns_404(client):
    response = await client.post(
        f"/api/v1/reminders/{uuid.uuid4()}/actions", json={"action": "TAKEN"}
    )
    assert response.status_code == 404
