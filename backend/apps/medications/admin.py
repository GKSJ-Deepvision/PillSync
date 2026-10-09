"""Django admin for medicines and schedules."""

from django.contrib import admin

from .models import MedicationSchedule, Medicine


class MedicationScheduleInline(admin.TabularInline):
    model = MedicationSchedule
    extra = 0


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ("name", "patient", "category", "quantity_remaining", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name", "brand_name", "patient__full_name")
    autocomplete_fields = ("patient", "reference", "prescription")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [MedicationScheduleInline]


@admin.register(MedicationSchedule)
class MedicationScheduleAdmin(admin.ModelAdmin):
    list_display = (
        "medicine",
        "slot",
        "time_of_day",
        "quantity_per_dose",
        "frequency",
        "is_active",
    )
    list_filter = ("slot", "frequency", "is_active")
    search_fields = ("medicine__name", "medicine__patient__full_name")
    autocomplete_fields = ("medicine",)
    readonly_fields = ("id", "created_at", "updated_at")
