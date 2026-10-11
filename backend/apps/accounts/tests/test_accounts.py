import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.profiles.models import PatientProfile

User = get_user_model()


@pytest.mark.django_db
def test_create_user():
    dummy_password = "dummy_test_password_123"  # pragma: allowlist secret
    user = User.objects.create_user(
        username="testpatient",
        email="patient@pillsync.local",
        password=dummy_password,
        role=User.Role.PATIENT,
    )
    assert user.username == "testpatient"
    assert user.role == "PATIENT"
    assert user.check_password(dummy_password)


@pytest.mark.django_db
def test_register_and_jwt_login():
    client = APIClient()
    dummy_pass = "SecurePass123_test"  # pragma: allowlist secret

    # 1. Register
    reg_res = client.post(
        "/api/accounts/register/",
        {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": dummy_pass,
            "role": "PATIENT",
        },
        format="json",
    )
    assert reg_res.status_code == status.HTTP_201_CREATED
    assert "tokens" in reg_res.data
    access_token = reg_res.data["tokens"]["access"]
    refresh_token = reg_res.data["tokens"]["refresh"]
    assert access_token and refresh_token

    # 2. Login
    login_res = client.post(
        "/api/accounts/login/",
        {
            "username": "newuser",
            "password": dummy_pass,
        },
        format="json",
    )
    assert login_res.status_code == status.HTTP_200_OK
    assert "tokens" in login_res.data

    # 3. Refresh Token
    refresh_res = client.post(
        "/api/accounts/token/refresh/",
        {"refresh": refresh_token},
        format="json",
    )
    assert refresh_res.status_code == status.HTTP_200_OK
    assert "access" in refresh_res.data

    # 4. Logout & Blacklist
    logout_res = client.post(
        "/api/accounts/logout/",
        {"refresh": refresh_token},
        format="json",
    )
    assert logout_res.status_code == status.HTTP_200_OK

    # 5. After blacklist, refreshing should fail
    blacklisted_res = client.post(
        "/api/accounts/token/refresh/",
        {"refresh": refresh_token},
        format="json",
    )
    assert blacklisted_res.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_google_id_token_exchange():
    client = APIClient()
    res = client.post(
        "/api/accounts/google/",
        {
            "id_token": "google_oauth_test_token_patient@example.com",
            "role": "PATIENT",
        },
        format="json",
    )
    assert res.status_code == status.HTTP_200_OK
    assert "tokens" in res.data
    assert res.data["user"]["role"] == "PATIENT"


@pytest.mark.django_db
def test_password_change_and_reset():
    client = APIClient()
    initial_pass = "InitialPass123_test"  # pragma: allowlist secret
    new_pass = "UpdatedPass456_test"  # pragma: allowlist secret

    user = User.objects.create_user(
        username="pwuser",
        email="pwuser@example.com",
        password=initial_pass,
    )

    # Authenticated password change
    client.force_authenticate(user=user)
    change_res = client.post(
        "/api/accounts/password/change/",
        {
            "old_password": initial_pass,
            "new_password": new_pass,
        },
        format="json",
    )
    assert change_res.status_code == status.HTTP_200_OK
    user.refresh_from_db()
    assert user.check_password(new_pass)

    # Password reset request
    client.force_authenticate(user=None)
    req_res = client.post(
        "/api/accounts/password/reset/",
        {"email": "pwuser@example.com"},
        format="json",
    )
    assert req_res.status_code == status.HTTP_200_OK
    token = req_res.data["token"]
    uid = req_res.data["uid"]

    # Confirm password reset
    reset_pass = "ResetPass789_test"  # pragma: allowlist secret
    confirm_res = client.post(
        "/api/accounts/password/reset/confirm/",
        {
            "uid": uid,
            "token": token,
            "new_password": reset_pass,
        },
        format="json",
    )
    assert confirm_res.status_code == status.HTTP_200_OK
    user.refresh_from_db()
    assert user.check_password(reset_pass)


@pytest.mark.django_db
def test_role_based_access_and_accessible_profiles():
    # Patient
    patient = User.objects.create_user(
        username="p1",
        email="p1@example.com",
        password="TestPass123_role",  # pragma: allowlist secret
        role=User.Role.PATIENT,
    )
    profile1 = PatientProfile.objects.create(user=patient, name="Profile 1")

    # Caregiver
    caregiver = User.objects.create_user(
        username="cg1",
        email="cg1@example.com",
        password="TestPass123_role",  # pragma: allowlist secret
        role=User.Role.CAREGIVER,
    )
    profile2 = PatientProfile.objects.create(name="Profile 2 Cared", caregiver=caregiver)

    # Admin
    admin = User.objects.create_user(
        username="adm1",
        email="adm1@example.com",
        password="TestPass123_role",  # pragma: allowlist secret
        role=User.Role.ADMIN,
    )

    # Check accessible_patient_profiles
    assert profile1 in patient.accessible_patient_profiles()
    assert profile2 not in patient.accessible_patient_profiles()

    assert profile2 in caregiver.accessible_patient_profiles()
    assert profile1 not in caregiver.accessible_patient_profiles()

    assert profile1 in admin.accessible_patient_profiles()
    assert profile2 in admin.accessible_patient_profiles()
