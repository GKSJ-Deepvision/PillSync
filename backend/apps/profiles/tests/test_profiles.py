from datetime import date, timedelta

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.profiles.models import PatientProfile


class PatientProfileAPITests(APITestCase):
    def test_create_profile(self):
        response = self.client.post(
            reverse("profile-list-create"),
            {
                "first_name": "Ashritha",
                "last_name": "Gowthami",
                "date_of_birth": "2003-01-01",
                "gender": "FEMALE",
                "phone_number": "9876543210",
                "address": "Hyderabad",
                "emergency_contact_name": "Parent",
                "emergency_contact_phone": "9876543211",
                "emergency_contact_relationship": "Parent",
                "medical_conditions": ["Diabetes"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PatientProfile.objects.count(), 1)

    def test_list_profiles(self):
        PatientProfile.objects.create(
            first_name="Test",
            last_name="Patient",
            date_of_birth=date(2000, 1, 1),
        )

        response = self.client.get(reverse("profile-list-create"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_reject_future_date_of_birth(self):
        response = self.client.post(
            reverse("profile-list-create"),
            {
                "first_name": "Future",
                "last_name": "Patient",
                "date_of_birth": str(date.today() + timedelta(days=1)),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_profile(self):
        profile = PatientProfile.objects.create(
            first_name="Old",
            last_name="Name",
            date_of_birth=date(2000, 1, 1),
        )

        response = self.client.patch(
            reverse("profile-detail", kwargs={"pk": profile.pk}),
            {"first_name": "Updated"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        profile.refresh_from_db()
        self.assertEqual(profile.first_name, "Updated")

    def test_delete_profile(self):
        profile = PatientProfile.objects.create(
            first_name="Delete",
            last_name="Me",
            date_of_birth=date(2000, 1, 1),
        )

        response = self.client.delete(reverse("profile-detail", kwargs={"pk": profile.pk}))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PatientProfile.objects.filter(pk=profile.pk).exists())
