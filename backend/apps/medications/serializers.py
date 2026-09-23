from django.db import transaction
from rest_framework import serializers

from apps.medications.models import Dosage, MedicationSchedule, Medicine


class MedicationScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationSchedule
        fields = (
            "id",
            "dosage",
            "scheduled_time",
            "time_of_day",
            "frequency",
            "repeat_rule",
            "start_date",
            "end_date",
        )


class MedicationScheduleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationSchedule
        fields = (
            "scheduled_time",
            "time_of_day",
            "frequency",
            "repeat_rule",
            "start_date",
            "end_date",
        )

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})

        return attrs


class DosageSerializer(serializers.ModelSerializer):
    schedules = MedicationScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Dosage
        fields = ("id", "medicine", "quantity", "unit", "schedules")


class MedicineSerializer(serializers.ModelSerializer):
    dosages = DosageSerializer(many=True, read_only=True)

    # Used when creating/updating a medicine from the application UI.
    schedule = MedicationScheduleWriteSerializer(
        write_only=True,
        required=False,
    )

    class Meta:
        model = Medicine
        fields = (
            "id",
            "patient",
            "medicine_name",
            "generic_name",
            "dosage",
            "dosage_form",
            "quantity",
            "disease_category",
            "is_active",
            "created_at",
            "dosages",
            "schedule",
        )
        read_only_fields = ("id", "patient", "created_at")

    def validate_dosage(self, value):
        if value <= 0:
            raise serializers.ValidationError("Dosage must be greater than zero.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        schedule_data = validated_data.pop("schedule", None)

        medicine = Medicine.objects.create(**validated_data)

        if schedule_data:
            dosage = Dosage.objects.create(
                medicine=medicine,
                quantity=medicine.dosage,
                unit=medicine.dosage_form,
            )

            MedicationSchedule.objects.create(
                dosage=dosage,
                **schedule_data,
            )

        return medicine

    @transaction.atomic
    def update(self, instance, validated_data):
        schedule_data = validated_data.pop("schedule", None)

        medicine = super().update(instance, validated_data)

        if schedule_data is not None:
            dosage = medicine.dosages.order_by("id").first()

            if dosage is None:
                dosage = Dosage.objects.create(
                    medicine=medicine,
                    quantity=medicine.dosage,
                    unit=medicine.dosage_form,
                )
            else:
                dosage.quantity = medicine.dosage
                dosage.unit = medicine.dosage_form
                dosage.save(update_fields=("quantity", "unit"))

            schedule = dosage.schedules.order_by("id").first()

            if schedule is None:
                MedicationSchedule.objects.create(
                    dosage=dosage,
                    **schedule_data,
                )
            else:
                for field, value in schedule_data.items():
                    setattr(schedule, field, value)
                schedule.save()

        return medicine
