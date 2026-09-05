"""Serializers for patient profiles, conditions and emergency contacts."""

from __future__ import annotations

from django.db import transaction
from rest_framework import serializers

from apps.common.models import MedicalCondition

from .models import CaregiverProfile, EmergencyContact, PatientCondition, PatientProfile


class EmergencyContactSerializer(serializers.ModelSerializer):
    relationship_display = serializers.CharField(source="get_relationship_display", read_only=True)

    class Meta:
        model = EmergencyContact
        fields = (
            "id",
            "patient",
            "name",
            "relationship",
            "relationship_display",
            "phone_number",
            "email",
            "is_primary",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_patient(self, value: PatientProfile) -> PatientProfile:
        request = self.context["request"]
        if not request.user.is_admin and value.managed_by_id != request.user.id:
            raise serializers.ValidationError("You do not manage that patient profile.")
        return value

    @transaction.atomic
    def create(self, validated_data: dict) -> EmergencyContact:
        # A unique partial index enforces one primary contact per patient, so
        # demote the incumbent instead of letting the insert fail.
        if validated_data.get("is_primary"):
            EmergencyContact.objects.filter(
                patient=validated_data["patient"], is_primary=True
            ).update(is_primary=False)
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance: EmergencyContact, validated_data: dict) -> EmergencyContact:
        if validated_data.get("is_primary"):
            EmergencyContact.objects.filter(patient=instance.patient, is_primary=True).exclude(
                pk=instance.pk
            ).update(is_primary=False)
        return super().update(instance, validated_data)


class PatientConditionSerializer(serializers.ModelSerializer):
    condition_name = serializers.CharField(source="condition.name", read_only=True)
    condition_code = serializers.CharField(source="condition.code", read_only=True)
    condition_category = serializers.CharField(source="condition.category", read_only=True)
    is_chronic = serializers.BooleanField(source="condition.is_chronic", read_only=True)

    class Meta:
        model = PatientCondition
        fields = (
            "id",
            "patient",
            "condition",
            "condition_code",
            "condition_name",
            "condition_category",
            "is_chronic",
            "diagnosed_on",
            "severity",
            "notes",
            "is_active",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_patient(self, value: PatientProfile) -> PatientProfile:
        request = self.context["request"]
        if not request.user.is_admin and value.managed_by_id != request.user.id:
            raise serializers.ValidationError("You do not manage that patient profile.")
        return value

    def validate(self, attrs: dict) -> dict:
        patient = attrs.get("patient") or getattr(self.instance, "patient", None)
        condition = attrs.get("condition") or getattr(self.instance, "condition", None)
        if patient and condition:
            clash = PatientCondition.objects.filter(patient=patient, condition=condition)
            if self.instance:
                clash = clash.exclude(pk=self.instance.pk)
            if clash.exists():
                raise serializers.ValidationError(
                    {"condition": "This condition is already recorded for the patient."}
                )
        return attrs


class PatientProfileSerializer(serializers.ModelSerializer):
    age = serializers.IntegerField(read_only=True)
    gender_display = serializers.CharField(source="get_gender_display", read_only=True)
    emergency_contacts = EmergencyContactSerializer(many=True, read_only=True)
    patient_conditions = PatientConditionSerializer(many=True, read_only=True)
    managed_by_name = serializers.CharField(source="managed_by.full_name", read_only=True)

    class Meta:
        model = PatientProfile
        fields = (
            "id",
            "user",
            "managed_by",
            "managed_by_name",
            "full_name",
            "relationship_to_manager",
            "date_of_birth",
            "age",
            "gender",
            "gender_display",
            "blood_group",
            "height_cm",
            "weight_kg",
            "allergies",
            "notes",
            "timezone_name",
            "preferred_reminder_channel",
            "is_self",
            "is_active",
            "emergency_contacts",
            "patient_conditions",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user", "managed_by", "is_self", "created_at", "updated_at")

    def validate_height_cm(self, value):
        if value is not None and not 30 <= value <= 275:
            raise serializers.ValidationError("Enter a height in centimetres between 30 and 275.")
        return value

    def validate_weight_kg(self, value):
        if value is not None and not 1 <= value <= 500:
            raise serializers.ValidationError("Enter a weight in kilograms between 1 and 500.")
        return value


class PatientProfileCreateSerializer(PatientProfileSerializer):
    """Add a family member's profile.

    `managed_by` is taken from the request rather than the payload - letting a
    client name the manager would let anyone attach a profile to someone else's
    account.
    """

    class Meta(PatientProfileSerializer.Meta):
        read_only_fields = ("id", "user", "managed_by", "created_at", "updated_at")

    def validate_full_name(self, value: str) -> str:
        request = self.context["request"]
        if PatientProfile.objects.filter(
            managed_by=request.user, full_name__iexact=value.strip()
        ).exists():
            raise serializers.ValidationError(
                "You already have a profile with that name. Use a distinguishing name, "
                "for example 'Asha (mother)'."
            )
        return value.strip()

    def create(self, validated_data: dict) -> PatientProfile:
        request = self.context["request"]
        validated_data["managed_by"] = request.user
        # A profile created through this endpoint is always a dependent: the
        # user's own profile is created once, at registration.
        validated_data["is_self"] = False
        validated_data["user"] = None
        return super().create(validated_data)


class CaregiverProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    active_patient_count = serializers.SerializerMethodField()

    class Meta:
        model = CaregiverProfile
        fields = (
            "id",
            "user",
            "full_name",
            "email",
            "organisation",
            "qualification",
            "license_number",
            "years_of_experience",
            "is_professional",
            "is_verified",
            "active_patient_count",
            "created_at",
        )
        read_only_fields = ("id", "user", "is_verified", "created_at")

    def get_active_patient_count(self, obj: CaregiverProfile) -> int:
        from apps.common.choices import AssignmentStatus

        return obj.user.patient_assignments.filter(status=AssignmentStatus.ACTIVE).count()


class MedicalConditionSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = MedicalCondition
        fields = ("id", "code", "name", "category", "category_display", "is_chronic")
