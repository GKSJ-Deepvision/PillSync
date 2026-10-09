from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import CaregiverPatientRelationship

User = get_user_model()


class CaregiverPatientRelationshipAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            role=User.Role.ADMIN,
        )
        self.caregiver = User.objects.create_user(
            username="caregiver",
            email="caregiver@example.com",
            role=User.Role.CAREGIVER,
        )
        self.other_caregiver = User.objects.create_user(
            username="other-caregiver",
            email="other-caregiver@example.com",
            role=User.Role.CAREGIVER,
        )
        self.patient = User.objects.create_user(
            username="patient",
            email="patient@example.com",
        )
        self.relationship = CaregiverPatientRelationship.objects.create(
            caregiver=self.caregiver,
            patient=self.patient,
        )

    def test_relationship_endpoints_require_authentication(self):
        self.assertEqual(
            self.client.get("/api/relationships/caregiver-patients/").status_code,
            401,
        )

    def test_caregiver_can_list_only_own_relationships(self):
        self.client.force_authenticate(self.caregiver)
        response = self.client.get("/api/relationships/caregiver-patients/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["patient_id"], self.patient.id)

        self.client.force_authenticate(self.other_caregiver)
        self.assertEqual(
            self.client.get("/api/relationships/caregiver-patients/").data,
            [],
        )

    def test_only_admin_can_create_and_duplicate_is_rejected(self):
        self.client.force_authenticate(self.caregiver)
        forbidden = self.client.post(
            "/api/relationships/caregiver-patients/",
            {"caregiver_id": self.caregiver.id, "patient_id": self.patient.id},
        )
        self.assertEqual(forbidden.status_code, 403)

        self.client.force_authenticate(self.admin)
        duplicate = self.client.post(
            "/api/relationships/caregiver-patients/",
            {"caregiver_id": self.caregiver.id, "patient_id": self.patient.id},
        )
        self.assertEqual(duplicate.status_code, 400)

    def test_caregiver_can_revoke_own_relationship_but_not_another_caregiver(self):
        self.client.force_authenticate(self.other_caregiver)
        forbidden = self.client.delete(
            f"/api/relationships/caregiver-patients/{self.relationship.id}/"
        )
        self.assertEqual(forbidden.status_code, 404)
        self.assertTrue(
            CaregiverPatientRelationship.objects.filter(id=self.relationship.id).exists()
        )

        self.client.force_authenticate(self.caregiver)
        response = self.client.delete(
            f"/api/relationships/caregiver-patients/{self.relationship.id}/"
        )
        self.assertEqual(response.status_code, 204)
        self.assertFalse(
            CaregiverPatientRelationship.objects.filter(id=self.relationship.id).exists()
        )

    def test_role_mismatch_is_rejected(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/relationships/caregiver-patients/",
            {"caregiver_id": self.patient.id, "patient_id": self.caregiver.id},
        )
        self.assertEqual(response.status_code, 400)
