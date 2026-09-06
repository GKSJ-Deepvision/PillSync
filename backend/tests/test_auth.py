import secrets

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole

TEST_PASSWORD = secrets.token_urlsafe(24)


@pytest.mark.django_db
def test_register_user():
    client = APIClient()

    response = client.post(
        "/auth/register/",
        {
            "email": "patient@example.com",
            "full_name": "Test Patient",
            "password": TEST_PASSWORD,
            "role": "PATIENT",
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["email"] == "patient@example.com"
    assert response.data["role"] == "PATIENT"
    assert User.objects.filter(email="patient@example.com").exists()


@pytest.mark.django_db
def test_login_user():
    User.objects.create_user(
        email="patient@example.com",
        full_name="Test Patient",
        password=TEST_PASSWORD,
        role=UserRole.PATIENT,
    )

    client = APIClient()

    response = client.post(
        "/auth/login/",
        {
            "email": "patient@example.com",
            "password": TEST_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 200
    assert "access_token" in response.data
    assert "refresh_token" in response.data


@pytest.mark.django_db
def test_invalid_login():
    User.objects.create_user(
        email="patient@example.com",
        full_name="Test Patient",
        password=TEST_PASSWORD,
        role=UserRole.PATIENT,
    )

    client = APIClient()

    response = client.post(
        "/auth/login/",
        {
            "email": "patient@example.com",
            "password": secrets.token_urlsafe(24),
        },
        format="json",
    )

    assert response.status_code == 401


@pytest.mark.django_db
def test_me_requires_authentication():
    client = APIClient()

    response = client.get("/auth/me/")

    assert response.status_code == 401


@pytest.mark.django_db
def test_patient_role_access():
    user = User.objects.create_user(
        email="patient@example.com",
        full_name="Test Patient",
        password=TEST_PASSWORD,
        role=UserRole.PATIENT,
    )

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/auth/patient-only/")

    assert response.status_code == 200
    assert response.data["role"] == "PATIENT"


@pytest.mark.django_db
def test_patient_cannot_access_caregiver_api():
    user = User.objects.create_user(
        email="patient@example.com",
        full_name="Test Patient",
        password=TEST_PASSWORD,
        role=UserRole.PATIENT,
    )

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/auth/caregiver-only/")

    assert response.status_code == 403


@pytest.mark.django_db
def test_patient_cannot_access_admin_api():
    user = User.objects.create_user(
        email="patient@example.com",
        full_name="Test Patient",
        password=TEST_PASSWORD,
        role=UserRole.PATIENT,
    )

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/auth/admin-only/")

    assert response.status_code == 403
