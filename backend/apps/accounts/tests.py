from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from .models import CaregiverPatientRelationship

User = get_user_model()
TEST_PASSWORD = "test-password-123"


class UserModelTests(TestCase):
    def test_user_creation(self):
        user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password=TEST_PASSWORD,
        )

        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(user.check_password(TEST_PASSWORD))

    def test_default_role_is_patient(self):
        user = User.objects.create_user(
            username="patient1",
            email="patient@example.com",
            password=TEST_PASSWORD,
        )

        self.assertEqual(user.role, User.Role.PATIENT)

    def test_email_is_unique(self):
        User.objects.create_user(
            username="user1",
            email="same@example.com",
            password=TEST_PASSWORD,
        )

        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                username="user2",
                email="same@example.com",
                password=TEST_PASSWORD,
            )


class CaregiverPatientRelationshipModelTests(TestCase):
    def setUp(self):
        self.caregiver = User.objects.create_user(
            username="caregiver",
            email="caregiver@example.com",
            role=User.Role.CAREGIVER,
        )
        self.patient = User.objects.create_user(
            username="patient",
            email="patient@example.com",
        )

    def test_valid_relationship_and_reverse_relations(self):
        relationship = CaregiverPatientRelationship.objects.create(
            caregiver=self.caregiver,
            patient=self.patient,
        )

        self.assertEqual(list(self.caregiver.patient_relationships.all()), [relationship])
        self.assertEqual(list(self.patient.caregiver_relationships.all()), [relationship])
        self.assertEqual(str(relationship), "caregiver -> patient")

    def test_clean_rejects_invalid_roles_and_self_assignment(self):
        invalid_caregiver = User.objects.create_user(
            username="not-caregiver",
            email="not-caregiver@example.com",
        )
        with self.assertRaises(ValidationError):
            CaregiverPatientRelationship(
                caregiver=invalid_caregiver,
                patient=self.patient,
            ).full_clean()

        invalid_patient = User.objects.create_user(
            username="not-patient",
            email="not-patient@example.com",
            role=User.Role.CAREGIVER,
        )
        with self.assertRaises(ValidationError):
            CaregiverPatientRelationship(
                caregiver=self.caregiver,
                patient=invalid_patient,
            ).full_clean()

        with self.assertRaises(ValidationError):
            CaregiverPatientRelationship(
                caregiver=self.caregiver,
                patient=self.caregiver,
            ).full_clean()

    def test_duplicate_relationship_is_rejected_by_database_constraint(self):
        CaregiverPatientRelationship.objects.create(
            caregiver=self.caregiver,
            patient=self.patient,
        )

        with self.assertRaises(IntegrityError):
            CaregiverPatientRelationship.objects.create(
                caregiver=self.caregiver,
                patient=self.patient,
            )
