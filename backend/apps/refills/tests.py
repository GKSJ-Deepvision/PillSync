from datetime import date, time

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APITestCase

from apps.medicines.models import Medicine, MedicineSchedule

from .models import RefillPrediction
from .services import RefillPredictionService

User = get_user_model()


def create_medicine(user, *, quantity=20, refill_threshold=5):
    medicine = Medicine.objects.create(
        user=user,
        name="Paracetamol",
        quantity=quantity,
        refill_threshold=refill_threshold,
    )
    MedicineSchedule.objects.create(
        medicine=medicine,
        dose="1 tablet",
        time=time(8, 0),
        frequency=MedicineSchedule.Frequency.DAILY,
        start_date=date.today(),
    )
    return medicine


class RefillPredictionServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="refillservice",
            email="refillservice@example.com",
        )

    def test_fallback_prediction_is_persisted(self):
        medicine = create_medicine(self.user, quantity=20, refill_threshold=5)

        prediction = RefillPredictionService().predict(medicine)

        self.assertEqual(prediction.daily_consumption, 1)
        self.assertEqual(prediction.days_remaining, 15)
        self.assertTrue(prediction.is_fallback)
        self.assertEqual(RefillPrediction.objects.count(), 1)

    def test_missing_schedule_is_rejected(self):
        medicine = Medicine.objects.create(user=self.user, name="Incomplete")

        with self.assertRaises(ValidationError):
            RefillPredictionService().predict(medicine)


class RefillPredictionAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="refillapi",
            email="refillapi@example.com",
        )
        self.other_user = User.objects.create_user(
            username="otherrefillapi",
            email="otherrefillapi@example.com",
        )
        self.medicine = create_medicine(self.user)
        self.other_medicine = create_medicine(self.other_user)
        self.url = f"/api/refills/medicines/{self.medicine.id}/prediction/"

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_can_request_prediction(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["medicine"], self.medicine.id)
        self.assertEqual(response.data["days_remaining"], 15)
        self.assertIn("predicted_refill_date", response.data)

    def test_other_users_medicine_is_not_accessible(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f"/api/refills/medicines/{self.other_medicine.id}/prediction/")

        self.assertEqual(response.status_code, 404)

    def test_incomplete_medicine_returns_validation_error(self):
        medicine = Medicine.objects.create(user=self.user, name="Incomplete")
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f"/api/refills/medicines/{medicine.id}/prediction/")

        self.assertEqual(response.status_code, 400)
        self.assertIn("active medication schedule", str(response.data))
