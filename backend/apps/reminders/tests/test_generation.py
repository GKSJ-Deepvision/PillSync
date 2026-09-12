from datetime import date, time

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.medicines.models import Medicine, MedicineSchedule
from apps.reminders.models import Reminder
from apps.reminders.services.generation import (
    generate_all,
    generate_for_medicine,
    generate_for_schedule,
    get_period,
    schedule_occurs_on,
)

User = get_user_model()
TEST_PASSWORD = "test-password-123"


class ReminderGenerationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="reminderuser",
            email="reminder@example.com",
            password=TEST_PASSWORD,
        )
        self.medicine = Medicine.objects.create(
            user=self.user,
            name="Paracetamol",
            dosage="500mg",
        )

    def test_get_period(self):
        self.assertEqual(get_period(time(8, 0)), Reminder.Period.MORNING)
        self.assertEqual(get_period(time(12, 0)), Reminder.Period.AFTERNOON)
        self.assertEqual(get_period(time(16, 59)), Reminder.Period.AFTERNOON)
        self.assertEqual(get_period(time(17, 0)), Reminder.Period.NIGHT)
        self.assertEqual(get_period(time(23, 0)), Reminder.Period.NIGHT)
        self.assertEqual(get_period(time(4, 59)), Reminder.Period.NIGHT)

    def test_daily_schedule_occurs_on_date(self):
        schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time=time(8, 0),
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date=date(2026, 9, 12),
        )

        self.assertTrue(schedule_occurs_on(schedule, date(2026, 9, 12)))
        self.assertTrue(schedule_occurs_on(schedule, date(2026, 9, 13)))
        self.assertFalse(schedule_occurs_on(schedule, date(2026, 9, 11)))

    def test_weekly_schedule_occurs_only_on_configured_day(self):
        schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time=time(8, 0),
            frequency=MedicineSchedule.Frequency.WEEKLY,
            day_of_week=MedicineSchedule.DayOfWeek.SATURDAY,
            start_date=date(2026, 9, 12),
        )

        self.assertTrue(schedule_occurs_on(schedule, date(2026, 9, 12)))
        self.assertFalse(schedule_occurs_on(schedule, date(2026, 9, 13)))

    def test_inactive_schedule_does_not_generate(self):
        schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time=time(8, 0),
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date=date(2026, 9, 12),
            is_active=False,
        )

        reminders = generate_for_schedule(
            schedule,
            start_date=date(2026, 9, 12),
            days=3,
        )

        self.assertEqual(reminders, [])
        self.assertEqual(Reminder.objects.count(), 0)

    def test_end_date_is_respected(self):
        schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time=time(8, 0),
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date=date(2026, 9, 12),
            end_date=date(2026, 9, 13),
        )

        reminders = generate_for_schedule(
            schedule,
            start_date=date(2026, 9, 12),
            days=5,
        )

        self.assertEqual(len(reminders), 2)
        self.assertEqual(Reminder.objects.count(), 2)

    def test_generates_daily_reminders(self):
        schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time=time(8, 0),
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date=date(2026, 9, 12),
        )

        reminders = generate_for_schedule(
            schedule,
            start_date=date(2026, 9, 12),
            days=3,
        )

        self.assertEqual(len(reminders), 3)
        self.assertEqual(Reminder.objects.count(), 3)
        self.assertEqual(reminders[0].period, Reminder.Period.MORNING)

    def test_generates_weekly_reminders(self):
        schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time=time(20, 0),
            frequency=MedicineSchedule.Frequency.WEEKLY,
            day_of_week=MedicineSchedule.DayOfWeek.SATURDAY,
            start_date=date(2026, 9, 12),
        )

        reminders = generate_for_schedule(
            schedule,
            start_date=date(2026, 9, 12),
            days=8,
        )

        self.assertEqual(len(reminders), 2)
        self.assertEqual(Reminder.objects.count(), 2)
        self.assertEqual(reminders[0].period, Reminder.Period.NIGHT)

    def test_generation_is_idempotent(self):
        schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time=time(8, 0),
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date=date(2026, 9, 12),
        )

        first = generate_for_schedule(
            schedule,
            start_date=date(2026, 9, 12),
            days=3,
        )
        second = generate_for_schedule(
            schedule,
            start_date=date(2026, 9, 12),
            days=3,
        )

        self.assertEqual(len(first), 3)
        self.assertEqual(len(second), 0)
        self.assertEqual(Reminder.objects.count(), 3)

    def test_generates_reminders_for_medicine(self):
        MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time=time(8, 0),
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date=date(2026, 9, 12),
        )

        reminders = generate_for_medicine(
            self.medicine,
            start_date=date(2026, 9, 12),
            days=3,
        )

        self.assertEqual(len(reminders), 3)
        self.assertEqual(Reminder.objects.count(), 3)

    def test_generates_reminders_for_all_active_schedules(self):
        second_medicine = Medicine.objects.create(
            user=self.user,
            name="Vitamin D",
            dosage="1000 IU",
        )

        MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time=time(8, 0),
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date=date(2026, 9, 12),
        )

        MedicineSchedule.objects.create(
            medicine=second_medicine,
            dose="1 tablet",
            time=time(20, 0),
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date=date(2026, 9, 12),
        )

        reminders = generate_all(
            start_date=date(2026, 9, 12),
            days=2,
        )

        self.assertEqual(len(reminders), 4)
        self.assertEqual(Reminder.objects.count(), 4)
