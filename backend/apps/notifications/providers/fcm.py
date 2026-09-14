import firebase_admin
from django.conf import settings
from firebase_admin import credentials, messaging

from .base import NotificationProvider


class FCMProvider(NotificationProvider):
    """Firebase Cloud Messaging notification provider."""

    def __init__(self):
        if not settings.FIREBASE_CREDENTIALS_PATH:
            raise RuntimeError("FIREBASE_CREDENTIALS_PATH is not configured.")

        if not firebase_admin._apps:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)

    def send(self, *, message: str, recipient: str) -> None:
        notification = messaging.Message(
            notification=messaging.Notification(
                title="PillSync Reminder",
                body=message,
            ),
            token=recipient,
        )

        messaging.send(notification)
