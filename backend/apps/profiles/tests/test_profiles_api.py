"""Patient profiles, family profiles, conditions and emergency contacts."""

from __future__ import annotations

import pytest
from django.urls import reverse

from apps.profiles.models import EmergencyContact, PatientCondition, PatientProfile

pytestmark = pytest.mark.django_db

PROFILES = "v1:patient-profile-list"
CONTACTS = "v1:emergency-contact-list"
CONDITIONS = "v1:patient-condition-list"


class TestProfileVisibility:
    def test_registration_gives_the_patient_exactly_one_profile(self, patient_client):
        response = patient_client.get(reverse(PROFILES))
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["is_self"] is True

    def test_a_patient_never_sees_another_patient(self, patient_client, other_patient):
        response = patient_client.get(reverse(PROFILES))
        names = [row["full_name"] for row in response.data["results"]]
        assert other_patient.full_name not in names

    def test_fetching_another_patients_profile_by_id_is_a_404(self, patient_client, other_patient):
        profile = PatientProfile.objects.get(user=other_patient)
        url = reverse("v1:patient-profile-detail", args=[profile.id])
        assert patient_client.get(url).status_code == 404

    def test_me_returns_the_users_own_profile(self, patient_client, patient):
        response = patient_client.get(reverse("v1:patient-profile-me"))
        assert response.status_code == 200
        assert response.data["full_name"] == patient.full_name

    def test_caregiver_sees_nothing_before_the_assignment_is_active(
        self, caregiver_client, patient, caregiver
    ):
        from apps.accounts.models import CaregiverAssignment

        CaregiverAssignment.objects.create(caregiver=caregiver, patient=patient)
        assert caregiver_client.get(reverse(PROFILES)).data["count"] == 0

    def test_caregiver_sees_the_patient_once_active(self, caregiver_client, active_assignment):
        response = caregiver_client.get(reverse(PROFILES))
        assert response.data["count"] == 1
        assert response.data["results"][0]["full_name"] == active_assignment.patient.full_name

    def test_caregiver_has_read_access_but_not_write(self, caregiver_client, active_assignment):
        profile = PatientProfile.objects.get(user=active_assignment.patient)
        url = reverse("v1:patient-profile-detail", args=[profile.id])

        assert caregiver_client.get(url).status_code == 200
        assert caregiver_client.patch(url, {"notes": "changed by caregiver"}).status_code == 403

    def test_revoking_the_assignment_removes_visibility(self, caregiver_client, active_assignment):
        active_assignment.revoke()
        assert caregiver_client.get(reverse(PROFILES)).data["count"] == 0

    def test_admin_sees_every_profile(self, admin_client, patient, other_patient):
        assert admin_client.get(reverse(PROFILES)).data["count"] >= 2

    def test_anonymous_access_is_refused(self, api_client):
        assert api_client.get(reverse(PROFILES)).status_code == 401


class TestFamilyProfiles:
    def test_a_patient_can_add_a_family_members_profile(self, patient_client, patient):
        response = patient_client.post(
            reverse(PROFILES),
            {
                "full_name": "Asha's Mother",
                "relationship_to_manager": "PARENT",
                "date_of_birth": "1955-04-11",
                "gender": "FEMALE",
            },
        )
        assert response.status_code == 201, response.data
        assert response.data["is_self"] is False

        profile = PatientProfile.objects.get(full_name="Asha's Mother")
        assert profile.managed_by == patient
        # A dependent profile has no login of its own.
        assert profile.user is None

    def test_the_manager_then_sees_both_profiles(self, patient_client):
        patient_client.post(reverse(PROFILES), {"full_name": "Grandfather"})
        assert patient_client.get(reverse(PROFILES)).data["count"] == 2

    def test_duplicate_profile_names_are_rejected(self, patient_client):
        patient_client.post(reverse(PROFILES), {"full_name": "Grandfather"})
        response = patient_client.post(reverse(PROFILES), {"full_name": "grandfather"})
        assert response.status_code == 400
        assert "full_name" in response.data["error"]["details"]

    def test_a_client_cannot_attach_a_profile_to_someone_else(
        self, patient_client, other_patient, patient
    ):
        response = patient_client.post(
            reverse(PROFILES), {"full_name": "Hijacked", "managed_by": str(other_patient.id)}
        )
        assert response.status_code == 201
        assert PatientProfile.objects.get(full_name="Hijacked").managed_by == patient

    def test_deleting_a_profile_deactivates_it(self, patient_client, patient):
        created = patient_client.post(reverse(PROFILES), {"full_name": "Uncle"})
        url = reverse("v1:patient-profile-detail", args=[created.data["id"]])

        assert patient_client.delete(url).status_code == 204
        profile = PatientProfile.objects.get(id=created.data["id"])
        assert profile.is_active is False  # retained, because history hangs off it


class TestProfileValidation:
    def test_impossible_height_is_rejected(self, patient_client, patient):
        profile = PatientProfile.objects.get(user=patient)
        url = reverse("v1:patient-profile-detail", args=[profile.id])
        assert patient_client.patch(url, {"height_cm": 400}).status_code == 400

    def test_a_future_date_of_birth_is_rejected(self, patient_client, patient):
        profile = PatientProfile.objects.get(user=patient)
        url = reverse("v1:patient-profile-detail", args=[profile.id])
        assert patient_client.patch(url, {"date_of_birth": "2999-01-01"}).status_code == 400

    def test_age_is_derived_from_the_date_of_birth(self, patient_client, patient):
        profile = PatientProfile.objects.get(user=patient)
        url = reverse("v1:patient-profile-detail", args=[profile.id])
        response = patient_client.patch(url, {"date_of_birth": "1990-01-01"})
        assert response.status_code == 200
        assert response.data["age"] >= 34


class TestEmergencyContacts:
    def test_add_a_contact(self, patient_client, patient):
        profile = PatientProfile.objects.get(user=patient)
        response = patient_client.post(
            reverse(CONTACTS),
            {
                "patient": str(profile.id),
                "name": "Ravi Patel",
                "relationship": "SPOUSE",
                "phone_number": "+91 98765 43210",
                "is_primary": True,
            },
        )
        assert response.status_code == 201, response.data

    def test_a_second_primary_contact_demotes_the_first(self, patient_client, patient):
        profile = PatientProfile.objects.get(user=patient)
        base = {"patient": str(profile.id), "phone_number": "+91 90000 00000", "is_primary": True}

        patient_client.post(reverse(CONTACTS), {**base, "name": "First"})
        patient_client.post(reverse(CONTACTS), {**base, "name": "Second"})

        primaries = EmergencyContact.objects.filter(patient=profile, is_primary=True)
        assert primaries.count() == 1
        assert primaries.first().name == "Second"

    def test_an_invalid_phone_number_is_rejected(self, patient_client, patient):
        profile = PatientProfile.objects.get(user=patient)
        response = patient_client.post(
            reverse(CONTACTS),
            {"patient": str(profile.id), "name": "Bad Phone", "phone_number": "not a phone"},
        )
        assert response.status_code == 400

    def test_a_contact_cannot_be_added_to_another_patient(self, patient_client, other_patient):
        profile = PatientProfile.objects.get(user=other_patient)
        response = patient_client.post(
            reverse(CONTACTS),
            {"patient": str(profile.id), "name": "Intruder", "phone_number": "+91 90000 00000"},
        )
        assert response.status_code == 400


class TestPatientConditions:
    def test_record_a_condition(self, patient_client, patient, condition):
        profile = PatientProfile.objects.get(user=patient)
        response = patient_client.post(
            reverse(CONDITIONS),
            {
                "patient": str(profile.id),
                "condition": str(condition.id),
                "diagnosed_on": "2020-06-01",
                "severity": "MODERATE",
            },
        )
        assert response.status_code == 201, response.data
        assert response.data["condition_name"] == "Type 2 Diabetes"
        assert response.data["is_chronic"] is True

    def test_the_same_condition_cannot_be_recorded_twice(self, patient_client, patient, condition):
        profile = PatientProfile.objects.get(user=patient)
        payload = {"patient": str(profile.id), "condition": str(condition.id)}
        assert patient_client.post(reverse(CONDITIONS), payload).status_code == 201
        assert patient_client.post(reverse(CONDITIONS), payload).status_code == 400

    def test_conditions_appear_on_the_profile(self, patient_client, patient, condition):
        profile = PatientProfile.objects.get(user=patient)
        PatientCondition.objects.create(patient=profile, condition=condition)

        response = patient_client.get(reverse("v1:patient-profile-detail", args=[profile.id]))
        assert len(response.data["patient_conditions"]) == 1
        assert response.data["patient_conditions"][0]["condition_code"] == "TYPE_2_DIABETES"

    def test_a_caregiver_can_read_but_not_add_conditions(
        self, caregiver_client, active_assignment, condition
    ):
        profile = PatientProfile.objects.get(user=active_assignment.patient)
        PatientCondition.objects.create(patient=profile, condition=condition)

        assert caregiver_client.get(reverse(CONDITIONS)).data["count"] == 1
        response = caregiver_client.post(
            reverse(CONDITIONS), {"patient": str(profile.id), "condition": str(condition.id)}
        )
        assert response.status_code == 400
