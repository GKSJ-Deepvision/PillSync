from datetime import date, time
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.medicines.models import Medicine, MedicineSchedule
from apps.notifications.models import Notification
from apps.notifications.tasks import send_notification
from apps.reminders.models import Reminder

User = get_user_model()


class SendNotificationTaskTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="taskuser",
            email="task@example.com",
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

        self.notification = Notification.objects.create(
            reminder=self.reminder,
            channel=Notification.Channel.EMAIL,
            message="Time to take your medicine.",
        )

    @patch("apps.notifications.tasks.NotificationDispatcher")
    def test_successful_notification_is_marked_sent(self, mock_dispatcher):
        send_notification(self.notification.id)

        mock_dispatcher.return_value.send.assert_called_once_with(
            self.notification,
        )

        self.notification.refresh_from_db()

        self.assertEqual(
            self.notification.status,
            Notification.Status.SENT,
        )
        self.assertEqual(self.notification.attempts, 1)
        self.assertIsNotNone(self.notification.sent_at)
        self.assertEqual(self.notification.last_error, "")

    @patch("apps.notifications.tasks.NotificationDispatcher")
    def test_failed_notification_is_marked_failed(self, mock_dispatcher):
        mock_dispatcher.return_value.send.side_effect = RuntimeError("Delivery failed")

        with self.assertRaises(RuntimeError):
            send_notification(self.notification.id)

        self.notification.refresh_from_db()

        self.assertEqual(
            self.notification.status,
            Notification.Status.FAILED,
        )
        self.assertEqual(self.notification.attempts, 1)
        self.assertEqual(
            self.notification.last_error,
            "Delivery failed",
        )
        self.assertIsNone(self.notification.sent_at)
