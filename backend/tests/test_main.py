from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "PillSync API is running"


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_protected_endpoint_without_token():
    response = client.get("/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_login():
    response = client.post(
        "/auth/login",
        data={"username": "vaishnavi", "password": "Test@123"},
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_protected_endpoint_with_token():
    login_response = client.post(
        "/auth/login",
        data={"username": "vaishnavi", "password": "Test@123"},
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.json()

    assert data["username"] == "vaishnavi"
    assert data["email"] == "vaishnavi@example.com"
    assert data["role"] == "patient"


def test_session_after_login():
    login_response = client.post(
        "/auth/login",
        data={"username": "vaishnavi", "password": "Test@123"},
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
        data={"username": "vaishnavi", "password": "Test@123"},
    )

    assert login_response.status_code == 200

    logout_response = client.post("/auth/logout")

    assert logout_response.status_code == 200
    assert logout_response.json() == {
        "message": "Successfully logged out"
    }

    session_response = client.get("/auth/session")

    assert session_response.status_code == 401
    assert session_response.json()["detail"] == "No active session"


def get_access_token(username: str, password: str) -> str:
    response = client.post(
        "/auth/login",
        data={"username": username, "password": password},
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def test_rbac_requires_authentication():
    response = client.get("/rbac/patient")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_patient_rbac_access():
    token = get_access_token("vaishnavi", "Test@123")

    response = client.get(
        "/rbac/patient",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "patient"


def test_patient_cannot_access_caregiver_rbac():
    token = get_access_token("vaishnavi", "Test@123")

    response = client.get(
        "/rbac/caregiver",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_patient_cannot_access_admin_rbac():
    token = get_access_token("vaishnavi", "Test@123")

    response = client.get(
        "/rbac/admin",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403

def test_caregiver_rbac_access():
    token = get_access_token("caregiver_test", "Caregiver@123")

    response = client.get(
        "/rbac/caregiver",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "caregiver"


def test_caregiver_cannot_access_patient_rbac():
    token = get_access_token("caregiver_test", "Caregiver@123")

    response = client.get(
        "/rbac/patient",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_caregiver_cannot_access_admin_rbac():
    token = get_access_token("caregiver_test", "Caregiver@123")

    response = client.get(
        "/rbac/admin",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_admin_rbac_access():
    token = get_access_token("admin_test", "Admin@123")

    response = client.get(
        "/rbac/admin",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "admin"


def test_admin_cannot_access_patient_rbac():
    token = get_access_token("admin_test", "Admin@123")

    response = client.get(
        "/rbac/patient",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_admin_cannot_access_caregiver_rbac():
    token = get_access_token("admin_test", "Admin@123")

    response = client.get(
        "/rbac/caregiver",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403

def test_create_profile():
    token = get_access_token("vaishnavi", "Test@123")

    response = client.post(
        "/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "full_name": "Vaishnavi Padala",
            "date_of_birth": "2005-05-15",
            "phone": "9876543210",
            "address": "Hyderabad, Telangana",
        },
    )

    assert response.status_code in [201, 400]

    if response.status_code == 201:
        data = response.json()
        assert data["full_name"] == "Vaishnavi Padala"
        assert data["user_id"] == 1


def test_get_profile():
    token = get_access_token("vaishnavi", "Test@123")

    response = client.get(
        "/profile",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["user_id"] == 1
    assert data["full_name"] == "Vaishnavi Padala"


def test_update_profile():
    token = get_access_token("vaishnavi", "Test@123")

    response = client.put(
        "/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "phone": "9123456789",
            "address": "Hyderabad",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert data["phone"] == "9123456789"
    assert data["address"] == "Hyderabad"


def test_profile_requires_authentication():
    response = client.get("/profile")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"