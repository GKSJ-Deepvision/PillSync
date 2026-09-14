from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.medicines.models import Medicine

from .models import Dosage
from .serializers import MedicationScheduleSerializer

User = get_user_model()


class DosageAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create(
            username="user1",
            email="user1@example.com",
        )
        self.other_user = User.objects.create(
            username="user2",
            email="user2@example.com",
        )

        self.medicine = Medicine.objects.create(
            user=self.user,
            name="Paracetamol",
        )
        self.other_medicine = Medicine.objects.create(
            user=self.other_user,
            name="Ibuprofen",
        )

        self.client.force_authenticate(user=self.user)

    def test_user_can_create_dosage_for_own_medicine(self):
        response = self.client.post(
            "/api/dosages/",
            {
                "medicine": self.medicine.id,
                "amount": "500 mg",
                "instructions": "Take after food",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Dosage.objects.count(), 1)
        self.assertEqual(Dosage.objects.first().medicine, self.medicine)

    def test_user_cannot_create_dosage_for_other_users_medicine(self):
        response = self.client.post(
            "/api/dosages/",
            {
                "medicine": self.other_medicine.id,
                "amount": "200 mg",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Dosage.objects.count(), 0)

    def test_user_only_sees_own_dosages(self):
        Dosage.objects.create(
            medicine=self.medicine,
            amount="500 mg",
        )
        Dosage.objects.create(
            medicine=self.other_medicine,
            amount="200 mg",
        )

        response = self.client.get("/api/dosages/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["medicine"], self.medicine.id)

    def test_can_create_daily_medication_schedule(self):
        dosage = Dosage.objects.create(
            medicine=self.medicine,
            amount="500 mg",
        )

        response = self.client.post(
            "/api/medication-schedules/",
            {
                "dosage": dosage.id,
                "time": "08:00:00",
                "frequency": "daily",
                "start_date": "2026-09-14",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_weekly_schedule_requires_day_of_week(self):
        dosage = Dosage.objects.create(
            medicine=self.medicine,
            amount="500 mg",
        )

        serializer = MedicationScheduleSerializer(
            data={
                "dosage": dosage.id,
                "time": "08:00:00",
                "frequency": "weekly",
                "start_date": "2026-09-14",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("day_of_week", serializer.errors)
