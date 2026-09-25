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
            "name": "History Test Medicine",
            "dosage": "10 mg",
            "quantity": 30,
            "frequency": "once daily",
        },
    )

    assert response.status_code == 201

    return response.json()["id"]


def create_test_reminder(headers):
    medicine_id = create_test_medicine(headers)

    schedule_response = client.post(
        "/dosage-schedules",
        headers=headers,
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
        headers=headers,
        json={
            "dosage_schedule_id": schedule_id,
            "scheduled_at": "2026-09-25T23:59:00",
        },
    )

    assert reminder_response.status_code == 201

    return reminder_response.json()["id"], medicine_id


def test_medication_history_requires_authentication():
    response = client.get("/medication-history")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_taken_reminder_creates_medication_history():
    headers = get_auth_headers()

    reminder_id, medicine_id = create_test_reminder(headers)

    action_response = client.post(
        f"/reminders/{reminder_id}/taken",
        headers=headers,
    )

    assert action_response.status_code == 200

    history_response = client.get(
        "/medication-history",
        headers=headers,
    )

    assert history_response.status_code == 200

    history = history_response.json()

    matching_records = [
        record
        for record in history
        if record["medicine_id"] == medicine_id
        and record["status"] == "taken"
    ]

    assert matching_records

    record = matching_records[-1]

    assert record["patient_id"] == 1
    assert record["medicine_id"] == medicine_id
    assert record["taken"] is True
    assert record["status"] == "taken"
    assert record["action_at"] is not None


def test_missed_reminder_creates_medication_history():
    headers = get_auth_headers()

    reminder_id, medicine_id = create_test_reminder(headers)

    action_response = client.post(
        f"/reminders/{reminder_id}/missed",
        headers=headers,
    )

    assert action_response.status_code == 200

    history_response = client.get(
        "/medication-history",
        headers=headers,
    )

    assert history_response.status_code == 200

    history = history_response.json()

    matching_records = [
        record
        for record in history
        if record["medicine_id"] == medicine_id
        and record["status"] == "missed"
    ]

    assert matching_records

    record = matching_records[-1]

    assert record["patient_id"] == 1
    assert record["medicine_id"] == medicine_id
    assert record["taken"] is False
    assert record["status"] == "missed"
    assert record["action_at"] is not None


def test_snoozed_reminder_creates_medication_history():
    headers = get_auth_headers()

    reminder_id, medicine_id = create_test_reminder(headers)

    action_response = client.post(
        f"/reminders/{reminder_id}/snooze",
        headers=headers,
        params={
            "snoozed_until": "2026-09-26T00:30:00",
        },
    )

    assert action_response.status_code == 200

    history_response = client.get(
        "/medication-history",
        headers=headers,
    )

    assert history_response.status_code == 200

    history = history_response.json()

    matching_records = [
        record
        for record in history
        if record["medicine_id"] == medicine_id
        and record["status"] == "snoozed"
    ]

    assert matching_records

    record = matching_records[-1]

    assert record["patient_id"] == 1
    assert record["medicine_id"] == medicine_id
    assert record["taken"] is False
    assert record["status"] == "snoozed"
    assert record["action_at"] is not None


def test_get_medication_history_by_id():
    headers = get_auth_headers()

    reminder_id, medicine_id = create_test_reminder(headers)

    action_response = client.post(
        f"/reminders/{reminder_id}/taken",
        headers=headers,
    )

    assert action_response.status_code == 200

    history_response = client.get(
        "/medication-history",
        headers=headers,
    )

    assert history_response.status_code == 200

    history = history_response.json()

    matching_records = [
        record
        for record in history
        if record["medicine_id"] == medicine_id
        and record["status"] == "taken"
    ]

    assert matching_records

    history_id = matching_records[-1]["id"]

    detail_response = client.get(
        f"/medication-history/{history_id}",
        headers=headers,
    )

    assert detail_response.status_code == 200

    data = detail_response.json()

    assert data["id"] == history_id
    assert data["patient_id"] == 1
    assert data["medicine_id"] == medicine_id
    assert data["status"] == "taken"
    assert data["taken"] is True


def test_medication_history_not_found():
    headers = get_auth_headers()

    response = client.get(
        "/medication-history/999999",
        headers=headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Medication history not found"
def test_patient_cannot_access_another_patients_history():
    owner_headers = get_auth_headers()

    reminder_id, medicine_id = create_test_reminder(owner_headers)

    action_response = client.post(
        f"/reminders/{reminder_id}/taken",
        headers=owner_headers,
    )
    assert action_response.status_code == 200

    history_response = client.get(
        "/medication-history",
        headers=owner_headers,
    )
    assert history_response.status_code == 200

    matching_history = [
        item
        for item in history_response.json()
        if item["medicine_id"] == medicine_id
        and item["status"] == "taken"
    ]

    assert matching_history

    history_id = matching_history[-1]["id"]

    register_response = client.post(
        "/auth/register",
        json={
            "username": "history_other_user",
            "email": "history_other_user@example.com",
            "password": "Test@123",
        },
    )

    assert register_response.status_code in {201, 400}

    login_response = client.post(
        "/auth/login",
        data={
            "username": "history_other_user",
            "password": "Test@123",
        },
    )

    assert login_response.status_code == 200

    other_user_token = login_response.json()["access_token"]

    other_user_headers = {
        "Authorization": f"Bearer {other_user_token}"
    }

    response = client.get(
        f"/medication-history/{history_id}",
        headers=other_user_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Medication history not found"