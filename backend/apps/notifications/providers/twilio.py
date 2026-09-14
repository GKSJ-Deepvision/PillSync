import os

from twilio.rest import Client

from .base import NotificationProvider


class TwilioProvider(NotificationProvider):
    """Twilio SMS notification provider."""

    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_FROM_NUMBER")

    def send(self, *, message: str, recipient: str) -> None:
        if not self.account_sid:
            raise RuntimeError("TWILIO_ACCOUNT_SID is not configured.")

        if not self.auth_token:
            raise RuntimeError("TWILIO_AUTH_TOKEN is not configured.")

        if not self.from_number:
            raise RuntimeError("TWILIO_FROM_NUMBER is not configured.")

        client = Client(self.account_sid, self.auth_token)

        client.messages.create(
            body=message,
            from_=self.from_number,
            to=recipient,
        )
