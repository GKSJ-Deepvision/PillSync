"""Notification provider interface.

Every channel — push, email, SMS — implements `send()` and returns a
`DeliveryResult`. Providers never raise for a delivery failure: a reminder that
fails to send must not take down the task that was sending it to fifty other
patients. They raise only for programming errors.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Protocol

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Message:
    """One notification, resolved and ready to send."""

    recipient_email: str
    recipient_phone: str
    subject: str
    body: str
    payload: dict = field(default_factory=dict)
    device_tokens: tuple[str, ...] = ()


@dataclass(frozen=True)
class DeliveryResult:
    ok: bool
    provider_message_id: str = ""
    error: str = ""

    @classmethod
    def sent(cls, provider_message_id: str = "") -> DeliveryResult:
        return cls(ok=True, provider_message_id=provider_message_id)

    @classmethod
    def failed(cls, error: str) -> DeliveryResult:
        return cls(ok=False, error=error)


class Provider(Protocol):
    """What a channel provider must implement."""

    name: str

    def is_configured(self) -> bool:
        """Whether credentials are present. Unconfigured providers are skipped."""

    def send(self, message: Message) -> DeliveryResult:
        """Attempt delivery. Must not raise on a provider-side failure."""


class ConsoleProvider:
    """Writes notifications to the log instead of sending them.

    The default in development and tests. It means the whole reminder pipeline
    can be exercised end to end without a Firebase project, a Twilio number or
    a SendGrid key — and without accidentally texting a real phone from a test
    run.
    """

    name = "console"

    def is_configured(self) -> bool:
        return True

    def send(self, message: Message) -> DeliveryResult:
        logger.info(
            "[console notification] to=%s subject=%r body=%r payload=%s",
            message.recipient_email or message.recipient_phone,
            message.subject,
            message.body,
            message.payload,
        )
        return DeliveryResult.sent(provider_message_id="console")
