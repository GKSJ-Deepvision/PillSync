# Create your tests here.
from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Medicine

User = get_user_model()
TEST_PASSWORD = "test-password-123"


class MedicineModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="medicineuser",
            email="medicine@example.com",
            password=TEST_PASSWORD,
        )

    def test_medicine_creation(self):
        medicine = Medicine.objects.create(
            user=self.user,
            name="Paracetamol",
            dosage="500mg",
            instructions="Take after food",
            quantity=20,
            refill_threshold=5,
        )

        self.assertEqual(medicine.name, "Paracetamol")
        self.assertEqual(medicine.quantity, 20)
        self.assertEqual(medicine.refill_threshold, 5)
        self.assertTrue(medicine.is_active)

    def test_medicine_belongs_to_user(self):
        medicine = Medicine.objects.create(
            user=self.user,
            name="Vitamin D",
        )

        self.assertEqual(medicine.user, self.user)
