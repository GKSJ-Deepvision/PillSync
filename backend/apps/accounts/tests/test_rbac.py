"""Role-based access control and the caregiver assignment workflow."""

from __future__ import annotations

import pytest
from django.urls import reverse

from apps.accounts.models import CaregiverAssignment
from apps.common.choices import AssignmentStatus

pytestmark = pytest.mark.django_db

ASSIGNMENTS = "v1:caregiver-assignment-list"
ADMIN_USERS = "v1:admin-user-list"


class TestAdminEndpoints:
    def test_patient_cannot_list_users(self, patient_client):
        assert patient_client.get(reverse(ADMIN_USERS)).status_code == 403

    def test_caregiver_cannot_list_users(self, caregiver_client):
        assert caregiver_client.get(reverse(ADMIN_USERS)).status_code == 403

    def test_admin_can_list_users(self, admin_client, patient, caregiver):
        response = admin_client.get(reverse(ADMIN_USERS))
        assert response.status_code == 200
        assert response.data["count"] >= 3

    def test_admin_can_deactivate_another_user(self, admin_client, patient):
        url = reverse("v1:admin-user-deactivate", args=[patient.id])
        assert admin_client.post(url).status_code == 200
        patient.refresh_from_db()
        assert not patient.is_active

    def test_admin_cannot_deactivate_themselves(self, admin_client, admin_user):
        url = reverse("v1:admin-user-deactivate", args=[admin_user.id])
        assert admin_client.post(url).status_code == 400
        admin_user.refresh_from_db()
        assert admin_user.is_active

    def test_admin_can_reactivate(self, admin_client, patient):
        patient.is_active = False
        patient.save(update_fields=["is_active"])
        assert (
            admin_client.post(reverse("v1:admin-user-activate", args=[patient.id])).status_code
            == 200
        )
        patient.refresh_from_db()
        assert patient.is_active


class TestCaregiverInvitation:
    def test_patient_invites_a_caregiver(self, patient_client, patient, caregiver):
        response = patient_client.post(
            reverse(ASSIGNMENTS),
            {"caregiver_email": caregiver.email, "relationship": "NURSE"},
        )
        assert response.status_code == 201, response.data
        assert response.data["status"] == AssignmentStatus.PENDING
        assert response.data["caregiver_email"] == caregiver.email

    def test_caregiver_cannot_invite_themselves_to_a_patient(self, caregiver_client, patient):
        response = caregiver_client.post(reverse(ASSIGNMENTS), {"caregiver_email": patient.email})
        assert response.status_code == 403

    def test_inviting_a_non_caregiver_account_is_rejected(self, patient_client, other_patient):
        response = patient_client.post(
            reverse(ASSIGNMENTS), {"caregiver_email": other_patient.email}
        )
        assert response.status_code == 400
        assert "caregiver_email" in response.data["error"]["details"]

    def test_inviting_an_unknown_email_is_rejected(self, patient_client):
        response = patient_client.post(
            reverse(ASSIGNMENTS), {"caregiver_email": "ghost@example.com"}
        )
        assert response.status_code == 400

    def test_the_same_caregiver_cannot_be_invited_twice(self, patient_client, caregiver):
        payload = {"caregiver_email": caregiver.email}
        assert patient_client.post(reverse(ASSIGNMENTS), payload).status_code == 201
        assert patient_client.post(reverse(ASSIGNMENTS), payload).status_code == 400


class TestAssignmentLifecycle:
    def test_only_the_patient_can_accept(self, auth_client, patient, caregiver):
        assignment = CaregiverAssignment.objects.create(caregiver=caregiver, patient=patient)
        url = reverse("v1:caregiver-assignment-accept", args=[assignment.id])

        assert auth_client(caregiver).post(url).status_code == 403
        assert auth_client(patient).post(url).status_code == 200

        assignment.refresh_from_db()
        assert assignment.is_active

    def test_accepting_twice_conflicts(self, patient_client, patient, caregiver):
        assignment = CaregiverAssignment.objects.create(caregiver=caregiver, patient=patient)
        url = reverse("v1:caregiver-assignment-accept", args=[assignment.id])
        assert patient_client.post(url).status_code == 200
        assert patient_client.post(url).status_code == 409

    def test_patient_can_decline(self, patient_client, patient, caregiver):
        assignment = CaregiverAssignment.objects.create(caregiver=caregiver, patient=patient)
        url = reverse("v1:caregiver-assignment-decline", args=[assignment.id])
        assert patient_client.post(url).status_code == 200
        assignment.refresh_from_db()
        assert assignment.status == AssignmentStatus.DECLINED

    def test_either_side_can_revoke(self, auth_client, active_assignment):
        url = reverse("v1:caregiver-assignment-revoke", args=[active_assignment.id])
        assert auth_client(active_assignment.caregiver).post(url).status_code == 200
        active_assignment.refresh_from_db()
        assert active_assignment.status == AssignmentStatus.REVOKED

    def test_an_unrelated_user_cannot_see_the_assignment(
        self, auth_client, other_patient, active_assignment
    ):
        url = reverse("v1:caregiver-assignment-detail", args=[active_assignment.id])
        assert auth_client(other_patient).get(url).status_code == 404

    def test_both_parties_see_the_assignment_in_their_list(self, auth_client, active_assignment):
        for user in (active_assignment.patient, active_assignment.caregiver):
            response = auth_client(user).get(reverse(ASSIGNMENTS))
            assert response.status_code == 200
            assert response.data["count"] == 1

    def test_anonymous_users_are_refused(self, api_client):
        assert api_client.get(reverse(ASSIGNMENTS)).status_code == 401
