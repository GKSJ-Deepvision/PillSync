"""Model-level rules for users and caregiver assignments."""

from __future__ import annotations

import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction

from apps.accounts.models import CaregiverAssignment
from apps.common.choices import AssignmentStatus, AuthProvider, UserRole

User = get_user_model()
pytestmark = pytest.mark.django_db


class TestUserManager:
    def test_create_user_normalises_and_lowercases_email(self):
        user = User.objects.create_user(
            email="  Asha.Patel@Example.COM  ".strip(),
            password="correct-horse-battery-42",  # pragma: allowlist secret
            full_name="Asha Patel",
        )
        assert user.email == "asha.patel@example.com"
        assert user.role == UserRole.PATIENT
        assert user.auth_provider == AuthProvider.LOCAL
        assert user.check_password("correct-horse-battery-42")

    def test_create_user_without_email_is_rejected(self):
        with pytest.raises(ValueError, match="email address is required"):
            User.objects.create_user(email="", password="x", full_name="No Email")

    def test_user_without_password_cannot_log_in(self):
        """Social sign-in users get an unusable password, not an empty one."""
        user = User.objects.create_user(email="google@example.com", full_name="Google User")
        assert not user.has_usable_password()
        assert not user.check_password("")

    def test_create_superuser_is_admin(self):
        admin = User.objects.create_superuser(
            email="root@example.com", password="correct-horse-battery-42", full_name="Root"
        )
        assert admin.is_staff and admin.is_superuser
        assert admin.role == UserRole.ADMIN
        assert admin.is_admin

    def test_email_is_unique(self, make_user):
        make_user("dup@example.com")
        with pytest.raises(Exception):  # noqa: B017 - ValidationError or IntegrityError
            make_user("dup@example.com")


class TestUserRoles:
    def test_role_helpers(self, patient, caregiver, admin_user):
        assert patient.is_patient and not patient.is_caregiver and not patient.is_admin
        assert caregiver.is_caregiver and not caregiver.is_admin
        assert admin_user.is_admin

    def test_superuser_counts_as_admin_regardless_of_role(self, make_user):
        user = make_user("super@example.com", UserRole.PATIENT, is_superuser=True)
        assert user.is_admin

    def test_short_name_falls_back_to_email(self, make_user):
        user = make_user("solo@example.com", full_name="Solo")
        assert user.short_name == "Solo"


class TestCaregiverAssignment:
    def test_assignment_starts_pending(self, patient, caregiver):
        assignment = CaregiverAssignment.objects.create(caregiver=caregiver, patient=patient)
        assert assignment.status == AssignmentStatus.PENDING
        assert not assignment.is_active
        # Managing medication is a higher bar than viewing it, so it is opt-in.
        assert assignment.can_view_adherence
        assert not assignment.can_manage_medications

    def test_activate_and_revoke_record_the_time(self, patient, caregiver):
        assignment = CaregiverAssignment.objects.create(caregiver=caregiver, patient=patient)
        assignment.activate()
        assignment.refresh_from_db()
        assert assignment.is_active and assignment.responded_at is not None

        assignment.revoke()
        assignment.refresh_from_db()
        assert assignment.status == AssignmentStatus.REVOKED

    def test_same_pair_cannot_be_assigned_twice(self, patient, caregiver):
        CaregiverAssignment.objects.create(caregiver=caregiver, patient=patient)
        with pytest.raises(IntegrityError), transaction.atomic():
            CaregiverAssignment.objects.create(caregiver=caregiver, patient=patient)

    def test_a_user_cannot_be_their_own_caregiver(self, caregiver):
        with pytest.raises(IntegrityError), transaction.atomic():
            CaregiverAssignment.objects.create(caregiver=caregiver, patient=caregiver)


class TestAccessibleProfiles:
    def test_patient_sees_only_their_own_profiles(self, patient, other_patient):
        visible = patient.accessible_patient_profiles()
        assert visible.count() == 1
        assert visible.first().user_id == patient.id

    def test_caregiver_sees_nothing_until_the_assignment_is_active(self, patient, caregiver):
        CaregiverAssignment.objects.create(caregiver=caregiver, patient=patient)
        assert caregiver.accessible_patient_profiles().count() == 0

    def test_caregiver_sees_the_patient_once_active(self, caregiver, active_assignment):
        visible = caregiver.accessible_patient_profiles()
        assert visible.count() == 1
        assert visible.first().user_id == active_assignment.patient_id

    def test_revoking_removes_access(self, caregiver, active_assignment):
        active_assignment.revoke()
        assert caregiver.accessible_patient_profiles().count() == 0

    def test_admin_sees_every_profile(self, admin_user, patient, other_patient):
        assert admin_user.accessible_patient_profiles().count() >= 2
