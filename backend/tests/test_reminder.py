from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

USERNAME = "vaishnavi"
PASSWORD = "Test@123"


def get_auth_headers():
    response = client.post(
        "/auth/login",
        data={
            "username": USERNAME,
            "password": PASSWORD,
        },
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}",
    }


def create_test_medicine(headers):
    response = client.post(
        "/medicines",
        headers=headers,
        json={
            "name": "Reminder Test Medicine",
            "dosage": "5 mg",
            "quantity": 30,
            "frequency": "once daily",
        },
    )

    assert response.status_code == 201

    return response.json()["id"]


def create_test_dosage_schedule(headers):
    medicine_id = create_test_medicine(headers)

    response = client.post(
        "/dosage-schedules",
        headers=headers,
        json={
            "medicine_id": medicine_id,
            "dosage_amount": 1,
            "time_of_day": "23:59:00",
            "frequency": "daily",
        },
    )

    assert response.status_code == 201

    return response.json()["id"]


def create_test_reminder(headers):
    schedule_id = create_test_dosage_schedule(headers)

    response = client.post(
        "/reminders",
        headers=headers,
        json={
            "dosage_schedule_id": schedule_id,
            "scheduled_at": "2026-09-25T23:59:00",
        },
    )

    assert response.status_code == 201

    return response.json()["id"], schedule_id


def test_reminder_requires_authentication():
    response = client.get("/reminders")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_create_reminder():
    headers = get_auth_headers()
    reminder_id, schedule_id = create_test_reminder(headers)

    response = client.get(
        f"/reminders/{reminder_id}",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == reminder_id
    assert data["dosage_schedule_id"] == schedule_id
    assert data["status"] == "pending"
    assert data["snoozed_until"] is None


def test_get_reminders():
    headers = get_auth_headers()
    reminder_id, _ = create_test_reminder(headers)

    response = client.get(
        "/reminders",
        headers=headers,
    )

    assert response.status_code == 200

    reminders = response.json()

    assert isinstance(reminders, list)
    assert any(
        reminder["id"] == reminder_id
        for reminder in reminders
    )


def test_get_reminder_by_id():
    headers = get_auth_headers()
    reminder_id, schedule_id = create_test_reminder(headers)

    response = client.get(
        f"/reminders/{reminder_id}",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == reminder_id
    assert data["dosage_schedule_id"] == schedule_id
    assert data["status"] == "pending"


def test_mark_reminder_taken():
    headers = get_auth_headers()
    reminder_id, _ = create_test_reminder(headers)

    response = client.put(
        f"/reminders/{reminder_id}",
        headers=headers,
        json={"status": "taken"},
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "taken"
    assert data["action_at"] is not None

def test_mark_reminder_missed():
    headers = get_auth_headers()
    reminder_id, _ = create_test_reminder(headers)

    response = client.put(
        f"/reminders/{reminder_id}",
        headers=headers,
        json={"status": "missed"},
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "missed"
    assert data["action_at"] is not None


def test_snooze_reminder():
    headers = get_auth_headers()
    reminder_id, _ = create_test_reminder(headers)

    response = client.put(
        f"/reminders/{reminder_id}",
        headers=headers,
        json={
            "status": "snoozed",
            "snoozed_until": "2026-09-26T00:30:00",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "snoozed"
    assert data["snoozed_until"] == "2026-09-26T00:30:00"
    assert data["action_at"] is not None


def test_invalid_reminder_status():
    headers = get_auth_headers()
    reminder_id, _ = create_test_reminder(headers)

    response = client.put(
        f"/reminders/{reminder_id}",
        headers=headers,
        json={
            "status": "invalid",
        },
    )

    assert response.status_code == 422


def test_reminder_not_found():
    headers = get_auth_headers()

    response = client.get(
        "/reminders/999999",
        headers=headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Reminder not found"


def test_delete_reminder():
    headers = get_auth_headers()
    reminder_id, _ = create_test_reminder(headers)

    response = client.delete(
        f"/reminders/{reminder_id}",
        headers=headers,
    )

    assert response.status_code == 204

    get_response = client.get(
        f"/reminders/{reminder_id}",
        headers=headers,
    )

    assert get_response.status_code == 404
    assert get_response.json()["detail"] == "Reminder not found"

def test_taken_action_endpoint():
    headers = get_auth_headers()
    reminder_id, _ = create_test_reminder(headers)

    response = client.post(
        f"/reminders/{reminder_id}/taken",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == reminder_id
    assert data["status"] == "taken"
    assert data["action_at"] is not None
    assert data["snoozed_until"] is None


def test_missed_action_endpoint():
    headers = get_auth_headers()
    reminder_id, _ = create_test_reminder(headers)

    response = client.post(
        f"/reminders/{reminder_id}/missed",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == reminder_id
    assert data["status"] == "missed"
    assert data["action_at"] is not None
    assert data["snoozed_until"] is None


def test_snooze_action_endpoint():
    headers = get_auth_headers()
    reminder_id, _ = create_test_reminder(headers)

    response = client.post(
        f"/reminders/{reminder_id}/snooze",
        headers=headers,
        params={
            "snoozed_until": "2026-09-26T00:30:00",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == reminder_id
    assert data["status"] == "snoozed"
    assert data["action_at"] is not None
    assert data["snoozed_until"] == "2026-09-26T00:30:00"

def test_cannot_modify_another_patients_reminder():
    owner_headers = get_auth_headers()

    reminder_id, _ = create_test_reminder(owner_headers)

    register_response = client.post(
        "/auth/register",
        json={
            "username": "reminder_other_user",
            "email": "reminder_other_user@example.com",
            "password": "Test@123",
        },
    )

    assert register_response.status_code in {201, 400}

    login_response = client.post(
        "/auth/login",
        data={
            "username": "reminder_other_user",
            "password": "Test@123",
        },
    )

    assert login_response.status_code == 200

    other_user_token = login_response.json()["access_token"]

    other_user_headers = {
        "Authorization": f"Bearer {other_user_token}",
    }

    response = client.post(
        f"/reminders/{reminder_id}/taken",
        headers=other_user_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Reminder not found"