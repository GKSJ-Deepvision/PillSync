"""Notification delivery: where to send, whether to send, and what was sent."""

from __future__ import annotations

from datetime import time

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.common.choices import (
    DevicePlatform,
    NotificationCategory,
    NotificationChannel,
    NotificationStatus,
)
from apps.common.models import UUIDTimeStampedModel


class DeviceToken(UUIDTimeStampedModel):
    """A Firebase Cloud Messaging registration token for one device.

    One user can have several - phone, tablet, laptop - and tokens rotate, so
    they are deactivated rather than deleted when the provider reports one as
    stale. That keeps a record of which device stopped responding.
    """

    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="device_tokens"
    )
    token = models.CharField(max_length=512, unique=True)
    platform = models.CharField(
        max_length=16, choices=DevicePlatform.choices, default=DevicePlatform.WEB
    )
    device_name = models.CharField(max_length=120, blank=True)
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("device token")
        indexes = [models.Index(fields=["user", "is_active"])]

    def __str__(self) -> str:
        return f"{self.user.email} · {self.get_platform_display()}"

    def deactivate(self, reason: str = "") -> None:
        self.is_active = False
        self.save(update_fields=["is_active", "updated_at"])


class NotificationPreference(UUIDTimeStampedModel):
    """Per-user delivery settings.

    Quiet hours are narrower here than in most apps on purpose. A patient who
    silences the platform stops taking their medicine, so quiet hours hold back
    only the deferrable housekeeping - see QUIET_HOURS_SUPPRESSIBLE below.
    """

    user = models.OneToOneField(
        "accounts.User", on_delete=models.CASCADE, related_name="notification_preference"
    )

    push_enabled = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)

    dose_reminders = models.BooleanField(default=True)
    missed_dose_alerts = models.BooleanField(default=True)
    refill_alerts = models.BooleanField(default=True)
    caregiver_alerts = models.BooleanField(default=True)

    quiet_hours_start = models.TimeField(null=True, blank=True, default=time(22, 0))
    quiet_hours_end = models.TimeField(null=True, blank=True, default=time(7, 0))

    class Meta:
        verbose_name = _("notification preference")

    def __str__(self) -> str:
        return f"Preferences for {self.user.email}"

    # -- policy ------------------------------------------------------------

    #: The only categories quiet hours may hold back.
    #:
    #: Deliberately a short list. A dose reminder fires at a time the patient
    #: chose, so silencing it during their own quiet hours would break exactly
    #: the 06:00 and 22:30 doses the platform exists to support - and a missed
    #: dose or a caregiver alert is urgent by definition. That leaves only the
    #: genuinely deferrable housekeeping.
    QUIET_HOURS_SUPPRESSIBLE = frozenset(
        {
            NotificationCategory.LOW_STOCK,
            NotificationCategory.REFILL_DUE,
            NotificationCategory.PRESCRIPTION_EXPIRY,
        }
    )

    CATEGORY_TOGGLES = {
        NotificationCategory.DOSE_REMINDER: "dose_reminders",
        NotificationCategory.DOSE_MISSED: "missed_dose_alerts",
        NotificationCategory.CAREGIVER_ALERT: "caregiver_alerts",
        NotificationCategory.LOW_STOCK: "refill_alerts",
        NotificationCategory.REFILL_DUE: "refill_alerts",
        NotificationCategory.PRESCRIPTION_EXPIRY: "refill_alerts",
    }

    CHANNEL_TOGGLES = {
        NotificationChannel.PUSH: "push_enabled",
        NotificationChannel.EMAIL: "email_enabled",
        NotificationChannel.SMS: "sms_enabled",
    }

    def allows_category(self, category: str) -> bool:
        field = self.CATEGORY_TOGGLES.get(category)
        return True if field is None else bool(getattr(self, field))

    def allows_channel(self, channel: str) -> bool:
        field = self.CHANNEL_TOGGLES.get(channel)
        return True if field is None else bool(getattr(self, field))

    def in_quiet_hours(self, at=None) -> bool:
        if not self.quiet_hours_start or not self.quiet_hours_end:
            return False
        moment = (at or timezone.localtime()).time()
        start, end = self.quiet_hours_start, self.quiet_hours_end
        if start <= end:
            return start <= moment < end
        # The window wraps midnight, e.g. 22:00 to 07:00.
        return moment >= start or moment < end

    def should_send(self, category: str, channel: str, at=None) -> bool:
        if not self.allows_category(category) or not self.allows_channel(channel):
            return False
        if category not in self.QUIET_HOURS_SUPPRESSIBLE:
            return True
        return not self.in_quiet_hours(at)


class NotificationLog(UUIDTimeStampedModel):
    """Every send attempt, successful or not.

    Delivery is the product here: "the reminder never arrived" has to be
    answerable, and reminder delivery success rate is a graded performance
    metric in Milestone 4.
    """

    recipient = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="notifications"
    )
    category = models.CharField(max_length=32, choices=NotificationCategory.choices)
    channel = models.CharField(max_length=16, choices=NotificationChannel.choices)
    status = models.CharField(
        max_length=16, choices=NotificationStatus.choices, default=NotificationStatus.QUEUED
    )

    subject = models.CharField(max_length=200, blank=True)
    body = models.TextField()
    payload = models.JSONField(
        default=dict, blank=True, help_text="Deep-link data the client app acts on."
    )

    dose_event = models.ForeignKey(
        "reminders.DoseEvent",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    provider_message_id = models.CharField(max_length=255, blank=True)
    error = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("notification")
        indexes = [
            models.Index(fields=["recipient", "-created_at"]),
            models.Index(fields=["category", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.get_category_display()} to {self.recipient.email} via {self.channel}"

    def mark_sent(self, provider_message_id: str = "") -> None:
        self.status = NotificationStatus.SENT
        self.provider_message_id = provider_message_id[:255]
        self.sent_at = timezone.now()
        self.save(update_fields=["status", "provider_message_id", "sent_at", "updated_at"])

    def mark_failed(self, error: str) -> None:
        self.status = NotificationStatus.FAILED
        self.error = error[:2000]
        self.save(update_fields=["status", "error", "updated_at"])

    def mark_skipped(self, reason: str) -> None:
        self.status = NotificationStatus.SKIPPED
        self.error = reason[:2000]
        self.save(update_fields=["status", "error", "updated_at"])
