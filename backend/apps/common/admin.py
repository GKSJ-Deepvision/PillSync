"""Django admin for reference data."""

from django.contrib import admin

from .models import MedicalCondition, MedicineReference


@admin.register(MedicalCondition)
class MedicalConditionAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "category", "is_chronic", "is_active")
    list_filter = ("category", "is_chronic", "is_active")
    search_fields = ("name", "code")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(MedicineReference)
class MedicineReferenceAdmin(admin.ModelAdmin):
    list_display = ("generic_name", "brand_name", "strength", "dosage_form", "category")
    list_filter = ("category", "requires_prescription", "is_active")
    search_fields = ("generic_name", "brand_name", "product_ndc", "pharm_class")
    readonly_fields = ("id", "created_at", "updated_at")
