from datetime import date, time

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.medicines.models import Medicine, MedicineSchedule
from apps.notifications.models import Notification
from apps.reminders.models import Reminder

User = get_user_model()


class NotificationModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="notificationuser",
            email="notification@example.com",
            password="test-password-123",
        )

        self.medicine = Medicine.objects.create(
            user=self.user,
            name="Paracetamol",
        )

        self.schedule = MedicineSchedule.objects.create(
            medicine=self.medicine,
            dose="1 tablet",
            time=time(8, 0),
            frequency=MedicineSchedule.Frequency.DAILY,
            start_date=date.today(),
        )

        self.reminder = Reminder.objects.create(
            schedule=self.schedule,
            scheduled_at=timezone.now(),
            period=Reminder.Period.MORNING,
        )

    def test_notification_defaults_to_pending(self):
        notification = Notification.objects.create(
            reminder=self.reminder,
            channel=Notification.Channel.PUSH,
            message="Time to take your medicine.",
        )

        self.assertEqual(
            notification.status,
            Notification.Status.PENDING,
        )
        self.assertEqual(notification.attempts, 0)
        self.assertEqual(notification.last_error, "")
        self.assertIsNone(notification.sent_at)

    def test_notification_str(self):
        notification = Notification.objects.create(
            reminder=self.reminder,
            channel=Notification.Channel.EMAIL,
            message="Time to take your medicine.",
        )

        self.assertIn("email", str(notification))
