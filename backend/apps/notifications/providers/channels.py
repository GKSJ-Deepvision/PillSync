"""Concrete providers for the three channels the specification names.

Each one degrades to the console provider when its credentials are absent, so a
developer without a Firebase project still sees the full reminder flow, and CI
never needs secrets to run the notification tests.

The third-party SDKs are imported inside `send()` rather than at module import.
They are optional dependencies: the platform must start, and its tests must
run, without firebase-admin, twilio or sendgrid installed.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import send_mail

from .base import ConsoleProvider, DeliveryResult, Message

logger = logging.getLogger(__name__)


class FirebasePushProvider:
    """Push via Firebase Cloud Messaging."""

    name = "fcm"

    def is_configured(self) -> bool:
        return bool(getattr(settings, "FIREBASE_CREDENTIALS_PATH", ""))

    def send(self, message: Message) -> DeliveryResult:
        if not message.device_tokens:
            return DeliveryResult.failed("No registered device for this user.")

        try:
            import firebase_admin
            from firebase_admin import credentials, messaging
        except ImportError:
            return DeliveryResult.failed("firebase-admin is not installed.")

        try:
            if not firebase_admin._apps:
                firebase_admin.initialize_app(
                    credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                )

            # Payload values must be strings for FCM data messages.
            data = {key: str(value) for key, value in message.payload.items()}
            multicast = messaging.MulticastMessage(
                notification=messaging.Notification(title=message.subject, body=message.body),
                data=data,
                tokens=list(message.device_tokens),
            )
            response = messaging.send_each_for_multicast(multicast)
        except Exception as exc:  # noqa: BLE001 - provider failure must not propagate
            logger.exception("FCM send failed")
            return DeliveryResult.failed(str(exc))

        if response.success_count == 0:
            first = next((r.exception for r in response.responses if r.exception), None)
            return DeliveryResult.failed(str(first) if first else "All device tokens rejected.")
        return DeliveryResult.sent(f"fcm:{response.success_count}/{len(message.device_tokens)}")


class EmailProvider:
    """Email through whatever EMAIL_BACKEND is configured.

    In development that is Django's console backend, so the message is printed
    rather than sent; in production it is SendGrid over SMTP.
    """

    name = "email"

    def is_configured(self) -> bool:
        return True

    def send(self, message: Message) -> DeliveryResult:
        if not message.recipient_email:
            return DeliveryResult.failed("No email address on this account.")
        try:
            sent = send_mail(
                subject=message.subject,
                message=message.body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[message.recipient_email],
                fail_silently=False,
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Email send failed")
            return DeliveryResult.failed(str(exc))

        if not sent:
            return DeliveryResult.failed("The mail backend accepted nothing.")
        return DeliveryResult.sent("email")


class TwilioSmsProvider:
    """SMS via Twilio."""

    name = "twilio"

    def is_configured(self) -> bool:
        return all(
            [
                getattr(settings, "TWILIO_ACCOUNT_SID", ""),
                getattr(settings, "TWILIO_AUTH_TOKEN", ""),
                getattr(settings, "TWILIO_FROM_NUMBER", ""),
            ]
        )

    def send(self, message: Message) -> DeliveryResult:
        if not message.recipient_phone:
            return DeliveryResult.failed("No phone number on this account.")

        try:
            from twilio.rest import Client
        except ImportError:
            return DeliveryResult.failed("twilio is not installed.")

        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            # SMS has no subject line, so the two are joined into one body.
            text = f"{message.subject}\n{message.body}" if message.subject else message.body
            sms = client.messages.create(
                body=text[:1500],
                from_=settings.TWILIO_FROM_NUMBER,
                to=message.recipient_phone,
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Twilio send failed")
            return DeliveryResult.failed(str(exc))

        return DeliveryResult.sent(sms.sid or "twilio")


_CONSOLE = ConsoleProvider()

_PROVIDERS = {
    "PUSH": FirebasePushProvider(),
    "EMAIL": EmailProvider(),
    "SMS": TwilioSmsProvider(),
}


def provider_for(channel: str):
    """The provider for a channel, or the console stand-in if it is unconfigured."""
    provider = _PROVIDERS.get(channel)
    if provider is None:
        return _CONSOLE
    if not provider.is_configured():
        logger.debug("%s provider is not configured; logging to console instead.", channel)
        return _CONSOLE
    return provider
