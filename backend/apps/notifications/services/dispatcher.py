from apps.notifications.models import Notification

from ..providers.fcm import FCMProvider
from ..providers.sendgrid import SendGridProvider
from ..providers.twilio import TwilioProvider


class NotificationDispatcher:
    """Route notifications to the provider for their channel."""

    def __init__(self):
        self.providers = {
            Notification.Channel.PUSH: FCMProvider,
            Notification.Channel.EMAIL: SendGridProvider,
            Notification.Channel.SMS: TwilioProvider,
        }

    def send(self, notification: Notification) -> None:
        provider_class = self.providers.get(notification.channel)

        if provider_class is None:
            raise ValueError(f"Unsupported notification channel: {notification.channel}")

        provider = provider_class()
        provider.send(
            message=notification.message,
            recipient=self._get_recipient(notification),
        )

    def _get_recipient(self, notification: Notification) -> str:
        user = notification.reminder.schedule.medicine.user

        if notification.channel == Notification.Channel.EMAIL:
            return user.email

        if notification.channel == Notification.Channel.PUSH:
            return getattr(user, "fcm_token", "")

        if notification.channel == Notification.Channel.SMS:
            return getattr(user, "phone_number", "")

        raise ValueError(f"Unsupported notification channel: {notification.channel}")
