# Create your tests here.
from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Profile

User = get_user_model()
TEST_PASSWORD = "test-password-123"


class ProfileModelTests(TestCase):
    def test_profile_creation(self):
        user = User.objects.create_user(
            username="profileuser",
            email="profile@example.com",
            password=TEST_PASSWORD,
        )

        profile = Profile.objects.create(
            user=user,
            phone_number="9876500000",
            emergency_contact_name="Emergency Contact",
            emergency_contact_phone="9876543210",
        )

        self.assertEqual(profile.user, user)
        self.assertEqual(profile.phone_number, "9876500000")
        self.assertEqual(profile.emergency_contact_name, "Emergency Contact")

    def test_profile_has_one_to_one_user_relationship(self):
        user = User.objects.create_user(
            username="profileuser2",
            email="profile2@example.com",
            password=TEST_PASSWORD,
        )

        profile = Profile.objects.create(user=user)

        self.assertEqual(user.profile, profile)
