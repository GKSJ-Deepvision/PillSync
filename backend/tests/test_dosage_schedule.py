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
            "name": "Dosage Test Medicine",
            "dosage": "5 mg",
            "quantity": 30,
            "frequency": "once daily",
        },
    )

    assert response.status_code == 201

    return response.json()["id"]


def test_create_dosage_schedule():
    headers = get_auth_headers()
    medicine_id = create_test_medicine(headers)

    response = client.post(
        "/dosage-schedules",
        headers=headers,
        json={
            "medicine_id": medicine_id,
            "dosage_amount": 1,
            "time_of_day": "08:00:00",
            "frequency": "daily",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["medicine_id"] == medicine_id
    assert data["dosage_amount"] == 1
    assert data["time_of_day"] == "08:00:00"
    assert data["frequency"] == "daily"


def test_get_dosage_schedules():
    headers = get_auth_headers()
    medicine_id = create_test_medicine(headers)

    client.post(
        "/dosage-schedules",
        headers=headers,
        json={
            "medicine_id": medicine_id,
            "dosage_amount": 1,
            "time_of_day": "08:00:00",
            "frequency": "daily",
        },
    )

    response = client.get(
        "/dosage-schedules",
        headers=headers,
    )

    assert response.status_code == 200

    schedules = response.json()

    assert isinstance(schedules, list)
    assert any(
        schedule["medicine_id"] == medicine_id
        for schedule in schedules
    )


def test_get_dosage_schedule_by_id():
    headers = get_auth_headers()
    medicine_id = create_test_medicine(headers)

    create_response = client.post(
        "/dosage-schedules",
        headers=headers,
        json={
            "medicine_id": medicine_id,
            "dosage_amount": 1,
            "time_of_day": "13:00:00",
            "frequency": "daily",
        },
    )

    schedule_id = create_response.json()["id"]

    response = client.get(
        f"/dosage-schedules/{schedule_id}",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == schedule_id
    assert data["medicine_id"] == medicine_id
    assert data["time_of_day"] == "13:00:00"


def test_update_dosage_schedule():
    headers = get_auth_headers()
    medicine_id = create_test_medicine(headers)

    create_response = client.post(
        "/dosage-schedules",
        headers=headers,
        json={
            "medicine_id": medicine_id,
            "dosage_amount": 1,
            "time_of_day": "08:00:00",
            "frequency": "daily",
        },
    )

    schedule_id = create_response.json()["id"]

    response = client.put(
        f"/dosage-schedules/{schedule_id}",
        headers=headers,
        json={
            "time_of_day": "09:00:00",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == schedule_id
    assert data["time_of_day"] == "09:00:00"
    assert data["dosage_amount"] == 1
    assert data["frequency"] == "daily"


def test_delete_dosage_schedule():
    headers = get_auth_headers()
    medicine_id = create_test_medicine(headers)

    create_response = client.post(
        "/dosage-schedules",
        headers=headers,
        json={
            "medicine_id": medicine_id,
            "dosage_amount": 1,
            "time_of_day": "20:00:00",
            "frequency": "daily",
        },
    )

    schedule_id = create_response.json()["id"]

    response = client.delete(
        f"/dosage-schedules/{schedule_id}",
        headers=headers,
    )

    assert response.status_code == 204

    get_response = client.get(
        f"/dosage-schedules/{schedule_id}",
        headers=headers,
    )

    assert get_response.status_code == 404
    assert get_response.json()["detail"] == "Dosage schedule not found"


def test_create_dosage_schedule_with_invalid_frequency():
    headers = get_auth_headers()
    medicine_id = create_test_medicine(headers)

    response = client.post(
        "/dosage-schedules",
        headers=headers,
        json={
            "medicine_id": medicine_id,
            "dosage_amount": 1,
            "time_of_day": "08:00:00",
            "frequency": "invalid frequency",
        },
    )

    assert response.status_code == 422


def test_create_dosage_schedule_with_invalid_dosage():
    headers = get_auth_headers()
    medicine_id = create_test_medicine(headers)

    response = client.post(
        "/dosage-schedules",
        headers=headers,
        json={
            "medicine_id": medicine_id,
            "dosage_amount": 0,
            "time_of_day": "08:00:00",
            "frequency": "daily",
        },
    )

    assert response.status_code == 422


def test_create_schedule_for_nonexistent_medicine():
    headers = get_auth_headers()

    response = client.post(
        "/dosage-schedules",
        headers=headers,
        json={
            "medicine_id": 999999,
            "dosage_amount": 1,
            "time_of_day": "08:00:00",
            "frequency": "daily",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Medicine not found"