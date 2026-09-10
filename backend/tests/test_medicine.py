from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def get_access_token(username: str, password: str) -> str:
    response = client.post(
        "/auth/login",
        data={"username": username, "password": password},
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def test_medicine_requires_authentication():
    response = client.get("/medicines")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_create_medicine():
    token = get_access_token("vaishnavi", "Test@123")

    response = client.post(
        "/medicines",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Test Medicine",
            "dosage": "5 mg",
            "quantity": 30,
            "frequency": "once daily",
            "start_date": "2026-09-10",
            "end_date": "2026-10-10",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["patient_id"] == 1
    assert data["name"] == "Test Medicine"
    assert data["dosage"] == "5 mg"
    assert data["quantity"] == 30
    assert data["frequency"] == "once daily"


def test_get_medicines():
    token = get_access_token("vaishnavi", "Test@123")

    response = client.get(
        "/medicines",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)


def test_get_medicine_by_id():
    token = get_access_token("vaishnavi", "Test@123")

    create_response = client.post(
        "/medicines",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Get Test Medicine",
            "dosage": "10 mg",
            "quantity": 20,
            "frequency": "twice daily",
        },
    )

    assert create_response.status_code == 201

    medicine_id = create_response.json()["id"]

    response = client.get(
        f"/medicines/{medicine_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == medicine_id
    assert response.json()["name"] == "Get Test Medicine"


def test_update_medicine():
    token = get_access_token("vaishnavi", "Test@123")

    create_response = client.post(
        "/medicines",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Update Test Medicine",
            "dosage": "5 mg",
            "quantity": 30,
            "frequency": "once daily",
        },
    )

    assert create_response.status_code == 201

    medicine_id = create_response.json()["id"]

    response = client.put(
        f"/medicines/{medicine_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "dosage": "10 mg",
            "quantity": 25,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == medicine_id
    assert data["dosage"] == "10 mg"
    assert data["quantity"] == 25
    assert data["name"] == "Update Test Medicine"


def test_delete_medicine():
    token = get_access_token("vaishnavi", "Test@123")

    create_response = client.post(
        "/medicines",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Delete Test Medicine",
            "dosage": "5 mg",
            "quantity": 10,
            "frequency": "once daily",
        },
    )

    assert create_response.status_code == 201

    medicine_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/medicines/{medicine_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert delete_response.status_code == 204

    get_response = client.get(
        f"/medicines/{medicine_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert get_response.status_code == 404


def test_create_medicine_rejects_invalid_quantity():
    token = get_access_token("vaishnavi", "Test@123")

    response = client.post(
        "/medicines",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Invalid Medicine",
            "dosage": "5 mg",
            "quantity": 0,
            "frequency": "once daily",
        },
    )

    assert response.status_code == 422


def test_create_medicine_rejects_invalid_dates():
    token = get_access_token("vaishnavi", "Test@123")

    response = client.post(
        "/medicines",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Invalid Date Medicine",
            "dosage": "5 mg",
            "quantity": 10,
            "frequency": "once daily",
            "start_date": "2026-10-10",
            "end_date": "2026-09-10",
        },
    )

    assert response.status_code == 422


def test_medicine_not_found():
    token = get_access_token("vaishnavi", "Test@123")

    response = client.get(
        "/medicines/999999",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Medicine not found"