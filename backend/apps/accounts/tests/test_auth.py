import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def patient_user(db):
    return User.objects.create_user(
        email="patient@example.com",
        full_name="Jane Patient",
        password="password123",  # pragma: allowlist secret
        role=UserRole.PATIENT,
    )


@pytest.fixture
def caregiver_user(db):
    return User.objects.create_user(
        email="caregiver@example.com",
        full_name="John Caregiver",
        password="password123",  # pragma: allowlist secret
        role=UserRole.CAREGIVER,
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="admin@example.com",
        full_name="Admin User",
        password="password123",  # pragma: allowlist secret
        role=UserRole.ADMIN,
    )


@pytest.mark.django_db
class TestAuthentication:
    def test_user_registration(self, api_client):
        data = {
            "email": "newuser@example.com",
            "full_name": "New User",
            "password": "strongpassword123",
            "role": "PATIENT",
        }
        response = api_client.post("/auth/register/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == "newuser@example.com"
        assert response.data["role"] == "PATIENT"

    def test_user_login(self, api_client, patient_user):
        data = {
            "email": "patient@example.com",
            "password": "password123",
        }
        response = api_client.post("/auth/login/", data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.data
        assert "refresh_token" in response.data

    def test_user_login_invalid_password(self, api_client, patient_user):
        data = {
            "email": "patient@example.com",
            "password": "wrongpassword",
        }
        response = api_client.post("/auth/login/", data, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_current_user_authenticated(self, api_client, patient_user):
        api_client.force_authenticate(user=patient_user)
        response = api_client.get("/auth/me/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == patient_user.email
        assert response.data["role"] == "PATIENT"

    def test_role_based_access_patient(self, api_client, patient_user):
        api_client.force_authenticate(user=patient_user)
        # Patient only allowed
        res_patient = api_client.get("/auth/patient-only/")
        assert res_patient.status_code == status.HTTP_200_OK

        # Caregiver only forbidden
        res_caregiver = api_client.get("/auth/caregiver-only/")
        assert res_caregiver.status_code == status.HTTP_403_FORBIDDEN

    def test_role_based_access_caregiver(self, api_client, caregiver_user):
        api_client.force_authenticate(user=caregiver_user)
        res_caregiver = api_client.get("/auth/caregiver-only/")
        assert res_caregiver.status_code == status.HTTP_200_OK

        res_patient = api_client.get("/auth/patient-only/")
        assert res_patient.status_code == status.HTTP_403_FORBIDDEN

    def test_role_based_access_admin(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        res_admin = api_client.get("/auth/admin-only/")
        assert res_admin.status_code == status.HTTP_200_OK
