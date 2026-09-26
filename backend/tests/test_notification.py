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


def create_test_notification(headers):
    response = client.post(
        "/notifications",
        headers=headers,
        json={
            "channel": "push",
            "title": "Medicine Reminder",
            "message": "Time to take your medicine.",
        },
    )

    assert response.status_code == 201

    return response.json()["id"]


def test_notification_requires_authentication():
    response = client.get("/notifications")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_create_notification():
    headers = get_auth_headers()

    response = client.post(
        "/notifications",
        headers=headers,
        json={
            "channel": "push",
            "title": "Medicine Reminder",
            "message": "Time to take your medicine.",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] is not None
    assert data["patient_id"] is not None
    assert data["channel"] == "push"
    assert data["title"] == "Medicine Reminder"
    assert data["message"] == "Time to take your medicine."
    assert data["status"] == "pending"
    assert data["sent_at"] is None


def test_get_notifications():
    headers = get_auth_headers()

    notification_id = create_test_notification(headers)

    response = client.get(
        "/notifications",
        headers=headers,
    )

    assert response.status_code == 200

    notifications = response.json()

    assert isinstance(notifications, list)
    assert any(notification["id"] == notification_id for notification in notifications)


def test_get_notification_by_id():
    headers = get_auth_headers()

    notification_id = create_test_notification(headers)

    response = client.get(
        f"/notifications/{notification_id}",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == notification_id
    assert data["channel"] == "push"
    assert data["status"] == "pending"


def test_notification_not_found():
    headers = get_auth_headers()

    response = client.get(
        "/notifications/999999",
        headers=headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Notification not found"


def test_invalid_notification_channel():
    headers = get_auth_headers()

    response = client.post(
        "/notifications",
        headers=headers,
        json={
            "channel": "whatsapp",
            "title": "Invalid Channel Test",
            "message": "This should fail.",
        },
    )

    assert response.status_code == 422


def test_notification_missing_title():
    headers = get_auth_headers()

    response = client.post(
        "/notifications",
        headers=headers,
        json={
            "channel": "push",
            "message": "Missing title test.",
        },
    )

    assert response.status_code == 422


def test_notification_missing_message():
    headers = get_auth_headers()

    response = client.post(
        "/notifications",
        headers=headers,
        json={
            "channel": "push",
            "title": "Missing message test",
        },
    )

    assert response.status_code == 422


def test_notification_invalid_reminder_id():
    headers = get_auth_headers()

    response = client.post(
        "/notifications",
        headers=headers,
        json={
            "reminder_id": 0,
            "channel": "push",
            "title": "Invalid Reminder",
            "message": "This should fail.",
        },
    )

    assert response.status_code == 422


def test_notification_ownership():
    owner_headers = get_auth_headers()

    notification_id = create_test_notification(owner_headers)

    register_response = client.post(
        "/auth/register",
        json={
            "username": "notification_other_user",
            "email": "notification_other_user@example.com",
            "password": "Test@123",
        },
    )

    assert register_response.status_code in {201, 400}

    login_response = client.post(
        "/auth/login",
        data={
            "username": "notification_other_user",
            "password": "Test@123",
        },
    )

    assert login_response.status_code == 200

    other_user_token = login_response.json()["access_token"]

    other_user_headers = {
        "Authorization": f"Bearer {other_user_token}",
    }

    response = client.get(
        f"/notifications/{notification_id}",
        headers=other_user_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Notification not found"


def test_cannot_create_notification_for_another_patients_reminder():
    owner_headers = get_auth_headers()

    medicine_response = client.post(
        "/medicines",
        headers=owner_headers,
        json={
            "name": "Notification Ownership Medicine",
            "dosage": "10 mg",
            "quantity": 20,
            "frequency": "once daily",
        },
    )

    assert medicine_response.status_code == 201

    medicine_id = medicine_response.json()["id"]

    schedule_response = client.post(
        "/dosage-schedules",
        headers=owner_headers,
        json={
            "medicine_id": medicine_id,
            "dosage_amount": 1,
            "time_of_day": "23:59:00",
            "frequency": "daily",
        },
    )

    assert schedule_response.status_code == 201

    schedule_id = schedule_response.json()["id"]

    reminder_response = client.post(
        "/reminders",
        headers=owner_headers,
        json={
            "dosage_schedule_id": schedule_id,
            "scheduled_at": "2026-09-25T23:59:00",
        },
    )

    assert reminder_response.status_code == 201

    reminder_id = reminder_response.json()["id"]

    register_response = client.post(
        "/auth/register",
        json={
            "username": "notification_reminder_other",
            "email": "notification_reminder_other@example.com",
            "password": "Test@123",
        },
    )

    assert register_response.status_code in {201, 400}

    login_response = client.post(
        "/auth/login",
        data={
            "username": "notification_reminder_other",
            "password": "Test@123",
        },
    )

    assert login_response.status_code == 200

    other_user_token = login_response.json()["access_token"]

    other_user_headers = {
        "Authorization": f"Bearer {other_user_token}",
    }

    response = client.post(
        "/notifications",
        headers=other_user_headers,
        json={
            "reminder_id": reminder_id,
            "channel": "push",
            "title": "Unauthorized Reminder",
            "message": "This should not be allowed.",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Reminder not found"
