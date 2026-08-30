from fastapi.testclient import TestClient

from config.database import Base, engine
from config.main import app

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def test_register_user():
    response = client.post(
        "/auth/register",
        json={
            "email": "patient@test.com",
            "full_name": "Test Patient",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 201
    data = response.json()

    assert data["email"] == "patient@test.com"
    assert data["role"] == "PATIENT"


def test_login_user():
    response = client.post(
        "/auth/login",
        json={
            "email": "patient@test.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_invalid_login():
    response = client.post(
        "/auth/login",
        json={
            "email": "patient@test.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401


def test_protected_endpoint_without_token():
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_patient_role_access():
    login_response = client.post(
        "/auth/login",
        json={
            "email": "patient@test.com",
            "password": "TestPassword123!",
        },
    )

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}",
    }

    patient_response = client.get(
        "/auth/patient-only",
        headers=headers,
    )

    assert patient_response.status_code == 200

    caregiver_response = client.get(
        "/auth/caregiver-only",
        headers=headers,
    )

    assert caregiver_response.status_code == 403

    admin_response = client.get(
        "/auth/admin-only",
        headers=headers,
    )

    assert admin_response.status_code == 403
