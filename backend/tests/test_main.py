from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_root():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "PillSync API is running",
        "version": "0.1.0",
    }


def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "environment": "development",
    }


def test_protected_endpoint_without_token():
    response = client.get("/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_login():
    response = client.post(
        "/auth/login",
        data={
            "username": "vaishnavi",
            "password": "Test@123",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_protected_endpoint_with_token():
    login_response = client.post(
        "/auth/login",
        data={
            "username": "vaishnavi",
            "password": "Test@123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["username"] == "vaishnavi"
    assert data["email"] == "vaishnavi@example.com"
    assert data["role"] == "patient"