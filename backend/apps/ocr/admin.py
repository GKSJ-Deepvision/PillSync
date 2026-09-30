"""Django admin for OCR jobs."""

from django.contrib import admin

from .models import ExtractedMedicine, OCRJob


class ExtractedMedicineInline(admin.TabularInline):
    model = ExtractedMedicine
    extra = 0
    fields = ("name", "strength", "strength_unit", "match_level", "confidence", "status")
    readonly_fields = fields
    can_delete = False


@admin.register(OCRJob)
class OCRJobAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "kind", "source", "status", "confidence", "created_at")
    list_filter = ("status", "kind", "source", "engine")
    search_fields = ("patient__full_name",)
    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
        "processing_ms",
        "raw_text",
        "header",
        "warnings",
    )
    inlines = [ExtractedMedicineInline]
