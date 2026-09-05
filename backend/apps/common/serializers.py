"""Serializers for reference data."""

from __future__ import annotations

from rest_framework import serializers

from .models import MedicalCondition, MedicineReference


class MedicalConditionSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = MedicalCondition
        fields = ("id", "code", "name", "category", "category_display", "is_chronic")


class MedicineReferenceSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    display_name = serializers.CharField(read_only=True)
    label = serializers.SerializerMethodField(
        help_text="One-line label suitable for a search result or autocomplete row."
    )

    class Meta:
        model = MedicineReference
        fields = (
            "id",
            "product_ndc",
            "generic_name",
            "brand_name",
            "display_name",
            "label",
            "dosage_form",
            "route",
            "strength",
            "strength_unit",
            "category",
            "category_display",
            "secondary_categories",
            "pharm_class",
            "requires_prescription",
        )

    def get_label(self, obj: MedicineReference) -> str:
        return str(obj)


class EnumOptionSerializer(serializers.Serializer):
    """One `{value, label}` pair in a dropdown."""

    value = serializers.CharField()
    label = serializers.CharField()


class CategorySummarySerializer(serializers.Serializer):
    code = serializers.CharField()
    label = serializers.CharField()
    medicine_count = serializers.IntegerField()


class EnumsSerializer(serializers.Serializer):
    """Every choice list the frontend renders, in one response."""

    roles = EnumOptionSerializer(many=True)
    genders = EnumOptionSerializer(many=True)
    blood_groups = EnumOptionSerializer(many=True)
    medicine_categories = EnumOptionSerializer(many=True)
    caregiver_relationships = EnumOptionSerializer(many=True)
    assignment_statuses = EnumOptionSerializer(many=True)
    condition_severities = EnumOptionSerializer(many=True)


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField()
    service = serializers.CharField()
    version = serializers.CharField()
