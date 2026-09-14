import os

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from .base import NotificationProvider


class SendGridProvider(NotificationProvider):
    """SendGrid email notification provider."""

    def __init__(self):
        self.api_key = os.getenv("SENDGRID_API_KEY")
        self.from_email = os.getenv("SENDGRID_FROM_EMAIL")

    def send(self, *, message: str, recipient: str) -> None:
        if not self.api_key:
            raise RuntimeError("SENDGRID_API_KEY is not configured.")

        if not self.from_email:
            raise RuntimeError("SENDGRID_FROM_EMAIL is not configured.")

        email = Mail(
            from_email=self.from_email,
            to_emails=recipient,
            subject="PillSync Reminder",
            plain_text_content=message,
        )

        client = SendGridAPIClient(self.api_key)
        client.send(email)
