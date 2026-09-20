from django.contrib import admin

from apps.adherence.models import DoseEvent


@admin.register(DoseEvent)
class DoseEventAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "schedule",
        "dose_date",
        "status",
        "taken_at",
        "missed_at",
        "snoozed_until",
    )
    list_filter = (
        "status",
        "dose_date",
    )
    search_fields = ("schedule__dosage__medicine__medicine_name",)
    ordering = (
        "-dose_date",
        "-id",
    )
