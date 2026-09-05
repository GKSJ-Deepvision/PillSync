"""Django admin for dose events."""

from django.contrib import admin

from .models import DoseEvent


@admin.register(DoseEvent)
class DoseEventAdmin(admin.ModelAdmin):
    list_display = ("medicine", "patient", "scheduled_for", "slot", "status", "responded_at")
    list_filter = ("status", "slot")
    search_fields = ("medicine__name", "patient__full_name")
    autocomplete_fields = ("schedule", "medicine", "patient")
    readonly_fields = ("id", "created_at", "updated_at")
    date_hierarchy = "scheduled_for"
