"""The authentication workflows Milestone 1 is graded on."""

from __future__ import annotations

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse

from apps.common.choices import UserRole
from apps.profiles.models import CaregiverProfile, PatientProfile

User = get_user_model()
pytestmark = pytest.mark.django_db

PASSWORD = "correct-horse-battery-42"  # pragma: allowlist secret


class TestRegistration:
    def test_patient_registration_returns_tokens_and_creates_a_profile(self, api_client):
        response = api_client.post(
            reverse("v1:auth:register"),
            {
                "email": "New.Patient@Example.com",
                "full_name": "New Patient",
                "password": PASSWORD,
                "password_confirm": PASSWORD,
                "role": UserRole.PATIENT,
            },
        )
        assert response.status_code == 201, response.data
        assert response.data["user"]["email"] == "new.patient@example.com"
        assert {"access", "refresh"} <= response.data["tokens"].keys()

        user = User.objects.get(email="new.patient@example.com")
        profile = PatientProfile.objects.get(user=user)
        assert profile.is_self and profile.full_name == "New Patient"

    def test_caregiver_registration_creates_a_caregiver_profile(self, api_client):
        response = api_client.post(
            reverse("v1:auth:register"),
            {
                "email": "carer@example.com",
                "full_name": "Care Giver",
                "password": PASSWORD,
                "password_confirm": PASSWORD,
                "role": UserRole.CAREGIVER,
            },
        )
        assert response.status_code == 201, response.data
        user = User.objects.get(email="carer@example.com")
        assert CaregiverProfile.objects.filter(user=user).exists()
        assert not PatientProfile.objects.filter(user=user).exists()

    def test_password_must_be_confirmed(self, api_client):
        response = api_client.post(
            reverse("v1:auth:register"),
            {
                "email": "mismatch@example.com",
                "full_name": "Mismatch",
                "password": PASSWORD,
                "password_confirm": "something-else-entirely",
            },
        )
        assert response.status_code == 400
        assert "password_confirm" in response.data["error"]["details"]

    def test_weak_password_is_rejected(self, api_client):
        response = api_client.post(
            reverse("v1:auth:register"),
            {
                "email": "weak@example.com",
                "full_name": "Weak Password",
                "password": "password12",
                "password_confirm": "password12",
            },
        )
        assert response.status_code == 400

    def test_duplicate_email_is_rejected_case_insensitively(self, api_client, patient):
        response = api_client.post(
            reverse("v1:auth:register"),
            {
                "email": patient.email.upper(),
                "full_name": "Impostor",
                "password": PASSWORD,
                "password_confirm": PASSWORD,
            },
        )
        assert response.status_code == 400
        assert "email" in response.data["error"]["details"]

    def test_registration_cannot_self_assign_the_admin_role(self, api_client):
        response = api_client.post(
            reverse("v1:auth:register"),
            {
                "email": "wannabe.admin@example.com",
                "full_name": "Wannabe Admin",
                "password": PASSWORD,
                "password_confirm": PASSWORD,
                "role": UserRole.ADMIN,
            },
        )
        assert response.status_code == 400
        assert not User.objects.filter(email="wannabe.admin@example.com").exists()


class TestLogin:
    def test_login_returns_tokens_and_the_user(self, api_client, patient):
        response = api_client.post(
            reverse("v1:auth:login"), {"email": patient.email, "password": PASSWORD}
        )
        assert response.status_code == 200, response.data
        assert response.data["user"]["id"] == str(patient.id)
        assert response.data["access"] and response.data["refresh"]

    def test_token_carries_the_role_claim(self, api_client, caregiver):
        from rest_framework_simplejwt.tokens import AccessToken

        response = api_client.post(
            reverse("v1:auth:login"), {"email": caregiver.email, "password": PASSWORD}
        )
        token = AccessToken(response.data["access"])
        assert token["role"] == UserRole.CAREGIVER
        assert token["email"] == caregiver.email

    def test_wrong_password_is_rejected(self, api_client, patient):
        response = api_client.post(
            reverse("v1:auth:login"), {"email": patient.email, "password": "not-the-password"}
        )
        assert response.status_code == 401

    def test_unknown_and_known_emails_fail_identically(self, api_client, patient):
        """Neither response may reveal whether the account exists."""
        unknown = api_client.post(
            reverse("v1:auth:login"), {"email": "nobody@example.com", "password": PASSWORD}
        )
        known = api_client.post(
            reverse("v1:auth:login"), {"email": patient.email, "password": "wrong-password-here"}
        )
        assert unknown.status_code == known.status_code == 401
        assert unknown.data["error"]["message"] == known.data["error"]["message"]

    def test_deactivated_account_cannot_log_in(self, api_client, patient):
        patient.is_active = False
        patient.save(update_fields=["is_active"])
        response = api_client.post(
            reverse("v1:auth:login"), {"email": patient.email, "password": PASSWORD}
        )
        assert response.status_code == 401


class TestTokenLifecycle:
    def test_refresh_returns_a_new_access_token(self, api_client, patient):
        login = api_client.post(
            reverse("v1:auth:login"), {"email": patient.email, "password": PASSWORD}
        )
        response = api_client.post(
            reverse("v1:auth:token-refresh"), {"refresh": login.data["refresh"]}
        )
        assert response.status_code == 200
        assert response.data["access"]

    def test_logout_blacklists_the_refresh_token(self, api_client, patient):
        login = api_client.post(
            reverse("v1:auth:login"), {"email": patient.email, "password": PASSWORD}
        )
        refresh = login.data["refresh"]
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

        assert api_client.post(reverse("v1:auth:logout"), {"refresh": refresh}).status_code == 205

        reused = api_client.post(reverse("v1:auth:token-refresh"), {"refresh": refresh})
        assert reused.status_code == 401

    def test_logout_requires_a_refresh_token(self, patient_client):
        assert patient_client.post(reverse("v1:auth:logout"), {}).status_code == 400


class TestMeEndpoint:
    def test_anonymous_access_is_refused(self, api_client):
        assert api_client.get(reverse("v1:me")).status_code == 401

    def test_returns_the_signed_in_user(self, patient_client, patient):
        response = patient_client.get(reverse("v1:me"))
        assert response.status_code == 200
        assert response.data["email"] == patient.email
        assert response.data["role_display"] == "Patient"

    def test_user_can_update_their_own_name(self, patient_client, patient):
        response = patient_client.patch(reverse("v1:me"), {"full_name": "Asha Renamed"})
        assert response.status_code == 200
        patient.refresh_from_db()
        assert patient.full_name == "Asha Renamed"

    def test_role_cannot_be_escalated_through_the_profile_endpoint(self, patient_client, patient):
        patient_client.patch(reverse("v1:me"), {"role": UserRole.ADMIN})
        patient.refresh_from_db()
        assert patient.role == UserRole.PATIENT


class TestPasswordManagement:
    def test_password_change_requires_the_current_password(self, patient_client):
        response = patient_client.post(
            reverse("v1:auth:password-change"),
            {
                "current_password": "wrong-current-password",
                "new_password": "another-strong-passphrase-9",
                "new_password_confirm": "another-strong-passphrase-9",
            },
        )
        assert response.status_code == 400

    def test_password_change_succeeds_and_takes_effect(self, patient_client, patient, api_client):
        new_password = "another-strong-passphrase-9"  # pragma: allowlist secret
        response = patient_client.post(
            reverse("v1:auth:password-change"),
            {
                "current_password": PASSWORD,
                "new_password": new_password,
                "new_password_confirm": new_password,
            },
        )
        assert response.status_code == 200, response.data

        patient.refresh_from_db()
        assert patient.check_password(new_password)
        assert (
            api_client.post(
                reverse("v1:auth:login"), {"email": patient.email, "password": new_password}
            ).status_code
            == 200
        )

    def test_new_password_must_differ_from_the_old_one(self, patient_client):
        response = patient_client.post(
            reverse("v1:auth:password-change"),
            {
                "current_password": PASSWORD,
                "new_password": PASSWORD,
                "new_password_confirm": PASSWORD,
            },
        )
        assert response.status_code == 400

    def test_reset_request_sends_an_email_for_a_known_address(self, api_client, patient):
        mail.outbox.clear()
        response = api_client.post(reverse("v1:auth:password-reset"), {"email": patient.email})
        assert response.status_code == 200
        assert len(mail.outbox) == 1
        assert patient.email in mail.outbox[0].to

    def test_reset_request_says_the_same_thing_for_an_unknown_address(self, api_client, patient):
        mail.outbox.clear()
        known = api_client.post(reverse("v1:auth:password-reset"), {"email": patient.email})
        unknown = api_client.post(
            reverse("v1:auth:password-reset"), {"email": "nobody@example.com"}
        )
        assert known.data == unknown.data
        assert len(mail.outbox) == 1  # only the real account was emailed

    def test_reset_confirm_sets_the_new_password(self, api_client, patient):
        from apps.accounts.serializers import PasswordResetRequestSerializer

        uid, token = PasswordResetRequestSerializer.build_token(patient)
        new_password = "a-brand-new-passphrase-7"  # pragma: allowlist secret

        response = api_client.post(
            reverse("v1:auth:password-reset-confirm"),
            {
                "uid": uid,
                "token": token,
                "new_password": new_password,
                "new_password_confirm": new_password,
            },
        )
        assert response.status_code == 200, response.data
        patient.refresh_from_db()
        assert patient.check_password(new_password)

    def test_a_reset_token_cannot_be_used_twice(self, api_client, patient):
        from apps.accounts.serializers import PasswordResetRequestSerializer

        uid, token = PasswordResetRequestSerializer.build_token(patient)
        payload = {
            "uid": uid,
            "token": token,
            "new_password": "a-brand-new-passphrase-7",
            "new_password_confirm": "a-brand-new-passphrase-7",
        }
        assert (
            api_client.post(reverse("v1:auth:password-reset-confirm"), payload).status_code == 200
        )
        assert (
            api_client.post(reverse("v1:auth:password-reset-confirm"), payload).status_code == 400
        )

    def test_a_tampered_token_is_rejected(self, api_client, patient):
        from apps.accounts.serializers import PasswordResetRequestSerializer

        uid, _token = PasswordResetRequestSerializer.build_token(patient)
        response = api_client.post(
            reverse("v1:auth:password-reset-confirm"),
            {
                "uid": uid,
                "token": "not-a-real-token",
                "new_password": "a-brand-new-passphrase-7",
                "new_password_confirm": "a-brand-new-passphrase-7",
            },
        )
        assert response.status_code == 400


class TestGoogleLogin:
    def test_google_login_is_refused_when_not_configured(self, api_client, settings):
        settings.GOOGLE_OAUTH2_CLIENT_ID = ""
        response = api_client.post(reverse("v1:auth:google-login"), {"id_token": "anything"})
        assert response.status_code == 400
        assert "id_token" in response.data["error"]["details"]

    def test_a_verified_google_identity_creates_an_account(self, api_client, settings, monkeypatch):
        settings.GOOGLE_OAUTH2_CLIENT_ID = "test-client-id.apps.googleusercontent.com"
        monkeypatch.setattr(
            "apps.accounts.views.verify_google_id_token",
            lambda _token: {
                "iss": "https://accounts.google.com",
                "email": "google.user@example.com",
                "email_verified": True,
                "name": "Google User",
            },
        )
        response = api_client.post(reverse("v1:auth:google-login"), {"id_token": "stub"})
        assert response.status_code == 201, response.data
        assert response.data["created"] is True

        user = User.objects.get(email="google.user@example.com")
        assert user.auth_provider == "GOOGLE"
        assert user.is_email_verified
        assert PatientProfile.objects.filter(user=user).exists()

    def test_signing_in_again_reuses_the_same_account(self, api_client, settings, monkeypatch):
        settings.GOOGLE_OAUTH2_CLIENT_ID = "test-client-id.apps.googleusercontent.com"
        monkeypatch.setattr(
            "apps.accounts.views.verify_google_id_token",
            lambda _token: {
                "iss": "https://accounts.google.com",
                "email": "repeat@example.com",
                "email_verified": True,
                "name": "Repeat User",
            },
        )
        first = api_client.post(reverse("v1:auth:google-login"), {"id_token": "stub"})
        second = api_client.post(reverse("v1:auth:google-login"), {"id_token": "stub"})

        assert first.status_code == 201
        assert second.status_code == 200
        assert second.data["created"] is False
        assert User.objects.filter(email="repeat@example.com").count() == 1
