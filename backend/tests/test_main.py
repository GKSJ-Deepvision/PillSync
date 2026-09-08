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

def test_session_after_login():
    login_response = client.post(
        "/auth/login",
        data={
            "username": "vaishnavi",
            "password": "Test@123",
        },
    )

    assert login_response.status_code == 200

    response = client.get("/auth/session")

    assert response.status_code == 200

    data = response.json()

    assert data["user_id"] == 1
    assert data["username"] == "vaishnavi"


def test_logout():
    login_response = client.post(
        "/auth/login",
        data={
            "username": "vaishnavi",
            "password": "Test@123",
        },
    )

    assert login_response.status_code == 200

    logout_response = client.post("/auth/logout")

    assert logout_response.status_code == 200
    assert logout_response.json() == {
        "message": "Successfully logged out",
    }

    session_response = client.get("/auth/session")

    assert session_response.status_code == 401
    assert session_response.json()["detail"] == "No active session"