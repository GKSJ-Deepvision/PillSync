"""Django admin for prescriptions."""

from django.contrib import admin

from .models import Prescription


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ("__str__", "patient", "status", "issued_on", "expires_on", "ocr_extracted")
    list_filter = ("status", "ocr_extracted")
    search_fields = ("doctor_name", "clinic_name", "reference_number", "patient__full_name")
    autocomplete_fields = ("patient",)
    readonly_fields = ("id", "created_at", "updated_at", "expiry_reminded_at")
