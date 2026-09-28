from datetime import date, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone

from apps.notifications.models import Notification
from apps.notifications.services.dispatcher import NotificationDispatcher
from apps.reminders.models import Reminder

from .models import Prescription
from .tasks import generate_prescription_expiry_reminders

User = get_user_model()


def create_prescription(user, expiry_date):
    return Prescription.objects.create(
        user=user,
        file=SimpleUploadedFile("prescription.pdf", b"content", content_type="application/pdf"),
        doctor_name="Dr. Test",
        issue_date=date.today() - timedelta(days=30),
        expiry_date=expiry_date,
    )


class PrescriptionExpiryReminderTaskTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="expiryuser",
            email="expiryuser@example.com",
        )
        self.other_user = User.objects.create_user(
            username="otherexpiryuser",
            email="otherexpiryuser@example.com",
        )

    def test_upcoming_prescription_creates_notification_for_owner(self):
        prescription = create_prescription(self.user, timezone.localdate() + timedelta(days=7))

        created = generate_prescription_expiry_reminders()

        self.assertEqual(created, 1)
        notification = Notification.objects.get()
        self.assertEqual(notification.reminder.prescription, prescription)
        self.assertEqual(notification.reminder.prescription.user, self.user)
        self.assertIn(str(prescription.expiry_date), notification.message)

    def test_prescription_outside_window_does_not_create_notification(self):
        create_prescription(self.user, timezone.localdate() + timedelta(days=31))

        self.assertEqual(generate_prescription_expiry_reminders(), 0)
        self.assertEqual(Notification.objects.count(), 0)

    def test_expired_prescription_does_not_create_notification(self):
        create_prescription(self.user, timezone.localdate() - timedelta(days=1))

        self.assertEqual(generate_prescription_expiry_reminders(), 0)
        self.assertEqual(Notification.objects.count(), 0)

    def test_repeated_task_execution_is_idempotent(self):
        create_prescription(self.user, timezone.localdate() + timedelta(days=7))

        self.assertEqual(generate_prescription_expiry_reminders(), 1)
        self.assertEqual(generate_prescription_expiry_reminders(), 0)
        self.assertEqual(Reminder.objects.count(), 1)
        self.assertEqual(Notification.objects.count(), 1)

    def test_users_only_get_notifications_for_their_prescriptions(self):
        create_prescription(self.user, timezone.localdate() + timedelta(days=7))
        create_prescription(self.other_user, timezone.localdate() + timedelta(days=7))

        generate_prescription_expiry_reminders()

        self.assertSetEqual(
            set(Notification.objects.values_list("reminder__prescription__user_id", flat=True)),
            {self.user.id, self.other_user.id},
        )


class PrescriptionExpiryDispatcherTests(TestCase):
    @patch("apps.notifications.services.dispatcher.SendGridProvider")
    def test_dispatcher_uses_prescription_owner_email(self, mock_provider):
        user = User.objects.create_user(
            username="dispatchexpiry",
            email="dispatchexpiry@example.com",
        )
        prescription = create_prescription(user, timezone.localdate() + timedelta(days=7))
        generate_prescription_expiry_reminders()
        notification = Notification.objects.get(reminder__prescription=prescription)

        NotificationDispatcher().send(notification)

        mock_provider.return_value.send.assert_called_once_with(
            message=notification.message,
            recipient="dispatchexpiry@example.com",
        )
