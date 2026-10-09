"""Serializers for notification preferences, devices and the delivery log."""

from __future__ import annotations

from rest_framework import serializers

from .models import DeviceToken, NotificationLog, NotificationPreference


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = (
            "id",
            "token",
            "platform",
            "device_name",
            "is_active",
            "last_used_at",
            "created_at",
        )
        read_only_fields = ("id", "is_active", "last_used_at", "created_at")
        extra_kwargs = {
            # No unique validator: the view deliberately re-registers an
            # existing token rather than rejecting it, because FCM hands the
            # same token back on every page load.
            "token": {"write_only": True, "validators": []},
        }


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = (
            "id",
            "push_enabled",
            "email_enabled",
            "sms_enabled",
            "dose_reminders",
            "missed_dose_alerts",
            "refill_alerts",
            "caregiver_alerts",
            "quiet_hours_start",
            "quiet_hours_end",
        )
        read_only_fields = ("id",)

    def validate(self, attrs: dict) -> dict:
        instance = self.instance
        start = attrs.get("quiet_hours_start", getattr(instance, "quiet_hours_start", None))
        end = attrs.get("quiet_hours_end", getattr(instance, "quiet_hours_end", None))
        if bool(start) != bool(end):
            raise serializers.ValidationError(
                {"quiet_hours_end": "Set both ends of the quiet-hours window, or neither."}
            )
        return attrs


class NotificationLogSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    channel_display = serializers.CharField(source="get_channel_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = NotificationLog
        fields = (
            "id",
            "category",
            "category_display",
            "channel",
            "channel_display",
            "status",
            "status_display",
            "subject",
            "body",
            "payload",
            "dose_event",
            "error",
            "sent_at",
            "created_at",
        )
        read_only_fields = fields
