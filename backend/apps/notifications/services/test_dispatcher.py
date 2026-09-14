from datetime import date, time
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.medicines.models import Medicine, MedicineSchedule
from apps.notifications.models import Notification
from apps.notifications.services.dispatcher import NotificationDispatcher
from apps.reminders.models import Reminder

User = get_user_model()


class NotificationDispatcherTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="dispatcheruser",
            email="dispatcher@example.com",
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

    @patch("apps.notifications.services.dispatcher.FCMProvider")
    def test_dispatches_push_notification(self, mock_provider):
        notification = Notification.objects.create(
            reminder=self.reminder,
            channel=Notification.Channel.PUSH,
            message="Take your medicine.",
        )

        dispatcher = NotificationDispatcher()
        dispatcher.providers[Notification.Channel.PUSH] = mock_provider

        dispatcher.send(notification)

        mock_provider.return_value.send.assert_called_once_with(
            message="Take your medicine.",
            recipient="",
        )

    @patch("apps.notifications.services.dispatcher.SendGridProvider")
    def test_dispatches_email_notification(self, mock_provider):
        notification = Notification.objects.create(
            reminder=self.reminder,
            channel=Notification.Channel.EMAIL,
            message="Take your medicine.",
        )

        dispatcher = NotificationDispatcher()
        dispatcher.providers[Notification.Channel.EMAIL] = mock_provider

        dispatcher.send(notification)

        mock_provider.return_value.send.assert_called_once_with(
            message="Take your medicine.",
            recipient="dispatcher@example.com",
        )

    @patch("apps.notifications.services.dispatcher.TwilioProvider")
    def test_dispatches_sms_notification(self, mock_provider):
        notification = Notification.objects.create(
            reminder=self.reminder,
            channel=Notification.Channel.SMS,
            message="Take your medicine.",
        )

        dispatcher = NotificationDispatcher()
        dispatcher.providers[Notification.Channel.SMS] = mock_provider

        dispatcher.send(notification)

        mock_provider.return_value.send.assert_called_once_with(
            message="Take your medicine.",
            recipient="",
        )
