"""Django admin for profiles."""

from django.contrib import admin

from .models import CaregiverProfile, EmergencyContact, PatientCondition, PatientProfile


class EmergencyContactInline(admin.TabularInline):
    model = EmergencyContact
    extra = 0


class PatientConditionInline(admin.TabularInline):
    model = PatientCondition
    extra = 0
    autocomplete_fields = ("condition",)


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "managed_by", "is_self", "gender", "date_of_birth", "is_active")
    list_filter = ("is_self", "is_active", "gender", "blood_group")
    search_fields = ("full_name", "managed_by__email", "managed_by__full_name")
    autocomplete_fields = ("user", "managed_by")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [PatientConditionInline, EmergencyContactInline]


@admin.register(CaregiverProfile)
class CaregiverProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "organisation", "is_professional", "is_verified")
    list_filter = ("is_professional", "is_verified")
    search_fields = ("user__email", "user__full_name", "organisation")
    autocomplete_fields = ("user",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ("name", "patient", "relationship", "phone_number", "is_primary")
    list_filter = ("relationship", "is_primary")
    search_fields = ("name", "phone_number", "patient__full_name")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(PatientCondition)
class PatientConditionAdmin(admin.ModelAdmin):
    list_display = ("patient", "condition", "severity", "diagnosed_on", "is_active")
    list_filter = ("severity", "is_active", "condition__category")
    search_fields = ("patient__full_name", "condition__name")
    autocomplete_fields = ("patient", "condition")
    readonly_fields = ("id", "created_at", "updated_at")
