# Create your tests here.
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase

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
