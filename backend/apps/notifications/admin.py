"""Django admin for notification delivery."""

from django.contrib import admin

from .models import DeviceToken, NotificationLog, NotificationPreference


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "platform", "device_name", "is_active", "last_used_at")
    list_filter = ("platform", "is_active")
    search_fields = ("user__email", "device_name")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "push_enabled", "email_enabled", "sms_enabled")
    list_filter = ("push_enabled", "email_enabled", "sms_enabled")
    search_fields = ("user__email",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("recipient", "category", "channel", "status", "sent_at")
    list_filter = ("category", "channel", "status")
    search_fields = ("recipient__email", "subject", "body")
    readonly_fields = ("id", "created_at", "updated_at", "sent_at")
    date_hierarchy = "created_at"
