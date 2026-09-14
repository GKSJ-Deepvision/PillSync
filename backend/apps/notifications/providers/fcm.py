import os

from .base import NotificationProvider


class FCMProvider(NotificationProvider):
    """Firebase Cloud Messaging notification provider."""

    def __init__(self):
        self.server_key = os.getenv("FCM_SERVER_KEY")

    def send(self, *, message: str, recipient: str) -> None:
        if not self.server_key:
            raise RuntimeError("FCM_SERVER_KEY is not configured.")

        # Actual FCM delivery will be implemented next.
        raise NotImplementedError
