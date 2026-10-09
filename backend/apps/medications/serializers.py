"""Serializers for medicines and their schedules."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.common.choices import ScheduleFrequency, Weekday
from apps.common.models import MedicineReference
from apps.profiles.models import PatientProfile

from .models import MedicationSchedule, Medicine


class MedicationScheduleSerializer(serializers.ModelSerializer):
    slot_display = serializers.CharField(source="get_slot_display", read_only=True)
    frequency_display = serializers.CharField(source="get_frequency_display", read_only=True)
    doses_per_day = serializers.SerializerMethodField()
    next_due_on = serializers.SerializerMethodField()

    class Meta:
        model = MedicationSchedule
        fields = (
            "id",
            "medicine",
            "slot",
            "slot_display",
            "time_of_day",
            "quantity_per_dose",
            "frequency",
            "frequency_display",
            "days_of_week",
            "interval_days",
            "start_date",
            "end_date",
            "is_active",
            "reminder_enabled",
            "remind_minutes_before",
            "doses_per_day",
            "next_due_on",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def get_doses_per_day(self, obj: MedicationSchedule) -> float:
        return float(obj.doses_per_day())

    def get_next_due_on(self, obj: MedicationSchedule) -> date | None:
        return obj.next_occurrence()

    def validate_medicine(self, value: Medicine) -> Medicine:
        accessible = self.context["request"].user.accessible_patient_profiles()
        if not accessible.filter(pk=value.patient_id).exists():
            raise serializers.ValidationError("You do not have access to that patient.")
        return value

    def validate(self, attrs: dict) -> dict:
        frequency = attrs.get("frequency", getattr(self.instance, "frequency", None))
        days = attrs.get("days_of_week", getattr(self.instance, "days_of_week", None)) or []

        if frequency == ScheduleFrequency.SPECIFIC_DAYS:
            if not days:
                raise serializers.ValidationError(
                    {"days_of_week": "Choose at least one day of the week."}
                )
            if any(day not in Weekday.values for day in days):
                raise serializers.ValidationError(
                    {"days_of_week": "Use ISO weekday numbers: Monday=1 to Sunday=7."}
                )
        else:
            # Stale day lists on a schedule that no longer uses them would be
            # confusing the next time someone edits it.
            attrs["days_of_week"] = []

        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError(
                {"end_date": "The end date cannot be before the start date."}
            )
        return attrs


class NestedScheduleSerializer(MedicationScheduleSerializer):
    """Schedules supplied inside a medicine payload.

    `medicine` is dropped: the medicine is the one being created, and asking a
    client to name it inside its own payload invites a mismatch.
    """

    class Meta(MedicationScheduleSerializer.Meta):
        fields = tuple(f for f in MedicationScheduleSerializer.Meta.fields if f != "medicine")


class MedicineSerializer(serializers.ModelSerializer):
    schedules = MedicationScheduleSerializer(many=True, read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    display_name = serializers.CharField(read_only=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)
    name = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        help_text="Optional when a catalogue reference is given; it is copied from there.",
    )
    daily_consumption = serializers.SerializerMethodField(
        help_text="Units per day across all active schedules; feeds refill prediction."
    )
    days_of_stock_left = serializers.SerializerMethodField()

    class Meta:
        model = Medicine
        fields = (
            "id",
            "patient",
            "patient_name",
            "reference",
            "prescription",
            "name",
            "brand_name",
            "display_name",
            "dosage_form",
            "strength",
            "strength_unit",
            "category",
            "category_display",
            "instructions",
            "quantity_remaining",
            "quantity_per_refill",
            "low_stock_threshold",
            "is_low_stock",
            "is_out_of_stock",
            "daily_consumption",
            "days_of_stock_left",
            "start_date",
            "end_date",
            "is_active",
            "notes",
            "schedules",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_daily_consumption(self, obj: Medicine) -> float:
        return float(sum(s.doses_per_day() for s in obj.schedules.all() if s.is_active))

    def get_days_of_stock_left(self, obj: Medicine) -> int | None:
        """A first approximation of the refill date, refined in Milestone 3."""
        per_day = sum(s.doses_per_day() for s in obj.schedules.all() if s.is_active)
        if per_day <= 0:
            return None
        return int(obj.quantity_remaining / per_day)

    def validate_patient(self, value: PatientProfile) -> PatientProfile:
        request = self.context["request"]
        if request.user.is_admin:
            return value
        # Managing a profile, not merely being able to read it, is what allows
        # adding medicines - a caregiver with view-only access must not.
        if value.managed_by_id != request.user.id:
            raise serializers.ValidationError("You do not manage that patient profile.")
        return value

    def validate_reference(self, value: MedicineReference | None):
        if value and not value.is_active:
            raise serializers.ValidationError("That catalogue entry is no longer available.")
        return value

    def validate(self, attrs: dict) -> dict:
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError(
                {"end_date": "The end date cannot be before the start date."}
            )

        name = attrs.get("name", getattr(self.instance, "name", "")) or ""
        reference = attrs.get("reference", getattr(self.instance, "reference", None))
        if not name.strip() and reference is None:
            raise serializers.ValidationError(
                {"name": "Give the medicine a name, or choose one from the catalogue."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data: dict) -> Medicine:
        reference = validated_data.get("reference")
        # Copy the catalogue details the client did not supply, so a medicine
        # picked from the catalogue is fully described without retyping.
        if reference:
            if not (validated_data.get("name") or "").strip():
                validated_data["name"] = reference.generic_name
            for field in ("brand_name", "dosage_form", "strength", "strength_unit", "category"):
                if not validated_data.get(field):
                    validated_data[field] = getattr(reference, field)
        return super().create(validated_data)


class MedicineCreateSerializer(MedicineSerializer):
    """Create a medicine and its first schedules in one request.

    Two round trips - medicine, then schedule - leaves a medicine with no doses
    if the second call fails, which looks to the patient like a medicine that
    silently never reminds them.
    """

    schedules = NestedScheduleSerializer(many=True, required=False)

    class Meta(MedicineSerializer.Meta):
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_schedules(self, value):
        seen = set()
        for entry in value:
            key = (entry.get("slot"), entry.get("time_of_day"))
            if key in seen:
                raise serializers.ValidationError(
                    "Two schedules cannot share the same slot and time."
                )
            seen.add(key)
        return value

    @transaction.atomic
    def create(self, validated_data: dict) -> Medicine:
        schedules = validated_data.pop("schedules", [])
        medicine = super().create(validated_data)

        for entry in schedules:
            entry.pop("medicine", None)
            MedicationSchedule.objects.create(medicine=medicine, **entry)

        if schedules:
            from apps.reminders.services.generation import generate_for_medicine

            generate_for_medicine(medicine)
        return medicine


class RefillSerializer(serializers.Serializer):
    """Record that the patient collected more of a medicine."""

    quantity = serializers.DecimalField(
        max_digits=8, decimal_places=2, min_value=Decimal("0.01"), required=False
    )

    def validate(self, attrs: dict) -> dict:
        medicine = self.context["medicine"]
        if "quantity" not in attrs:
            if not medicine.quantity_per_refill:
                raise serializers.ValidationError(
                    {"quantity": "Enter a quantity, or set a pack size on the medicine first."}
                )
            attrs["quantity"] = medicine.quantity_per_refill
        return attrs
