# Create your tests here.
from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Medicine, MedicineSchedule

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


class MedicineScheduleModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="scheduleuser",
            email="schedule@example.com",
            password=TEST_PASSWORD,
        )
        self.medicine = Medicine.objects.create(
            user=self.user,
            name="Paracetamol",
            dosage="500mg",
        )

    def test_schedule_creation(self):
        schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time="08:00:00",
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date="2026-09-05",
        )

        self.assertEqual(schedule.medicine, self.medicine)
        self.assertEqual(schedule.dose, "1 tablet")
        self.assertEqual(schedule.frequency, MedicineSchedule.Frequency.DAILY)
        self.assertTrue(schedule.is_active)

    def test_schedule_belongs_to_medicine(self):
        schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time="08:00:00",
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date="2026-09-05",
        )

        self.assertEqual(schedule.medicine, self.medicine)

    def test_medicine_can_have_multiple_schedules(self):
        MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time="08:00:00",
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date="2026-09-05",
        )
        MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time="20:00:00",
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date="2026-09-05",
        )

        self.assertEqual(self.medicine.schedules.count(), 2)
