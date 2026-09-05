"""Django admin for accounts."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import CaregiverAssignment, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("-date_joined",)
    list_display = ("email", "full_name", "role", "is_active", "is_email_verified", "date_joined")
    list_filter = ("role", "is_active", "is_staff", "is_email_verified", "auth_provider")
    search_fields = ("email", "full_name", "phone_number")
    readonly_fields = (
        "id",
        "date_joined",
        "last_login",
        "created_at",
        "updated_at",
        "last_login_ip",
    )

    fieldsets = (
        (None, {"fields": ("id", "email", "password")}),
        ("Personal", {"fields": ("full_name", "phone_number")}),
        ("Role and access", {"fields": ("role", "auth_provider", "is_email_verified")}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        (
            "Dates",
            {"fields": ("last_login", "date_joined", "created_at", "updated_at", "last_login_ip")},
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "role", "password1", "password2"),
            },
        ),
    )


@admin.register(CaregiverAssignment)
class CaregiverAssignmentAdmin(admin.ModelAdmin):
    list_display = ("caregiver", "patient", "relationship", "status", "created_at")
    list_filter = ("status", "relationship", "can_manage_medications")
    search_fields = (
        "caregiver__email",
        "caregiver__full_name",
        "patient__email",
        "patient__full_name",
    )
    autocomplete_fields = ("caregiver", "patient", "invited_by")
    readonly_fields = ("id", "created_at", "updated_at", "responded_at")
