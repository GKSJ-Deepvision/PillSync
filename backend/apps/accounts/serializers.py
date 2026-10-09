from rest_framework import serializers

from .models import CaregiverPatientRelationship, User


class CaregiverPatientRelationshipSerializer(serializers.ModelSerializer):
    caregiver_id = serializers.IntegerField(source="caregiver.id", read_only=True)
    caregiver_username = serializers.CharField(source="caregiver.username", read_only=True)
    patient_id = serializers.IntegerField(source="patient.id", read_only=True)
    patient_username = serializers.CharField(source="patient.username", read_only=True)

    class Meta:
        model = CaregiverPatientRelationship
        fields = [
            "id",
            "caregiver_id",
            "caregiver_username",
            "patient_id",
            "patient_username",
            "created_at",
        ]
        read_only_fields = fields


class RelationshipCreateSerializer(serializers.ModelSerializer):
    caregiver_id = serializers.PrimaryKeyRelatedField(
        source="caregiver",
        queryset=User.objects.all(),
    )
    patient_id = serializers.PrimaryKeyRelatedField(
        source="patient",
        queryset=User.objects.all(),
    )

    class Meta:
        model = CaregiverPatientRelationship
        fields = ["caregiver_id", "patient_id"]

    def validate(self, attrs):
        caregiver = attrs["caregiver"]
        patient = attrs["patient"]
        if caregiver.role != User.Role.CAREGIVER:
            raise serializers.ValidationError(
                {"caregiver_id": "The selected user is not a caregiver."}
            )
        if patient.role != User.Role.PATIENT:
            raise serializers.ValidationError({"patient_id": "The selected user is not a patient."})
        if caregiver == patient:
            raise serializers.ValidationError(
                {"patient_id": "A user cannot be their own caregiver."}
            )
        if CaregiverPatientRelationship.objects.filter(
            caregiver=caregiver,
            patient=patient,
        ).exists():
            raise serializers.ValidationError("This caregiver-patient relationship already exists.")
        return attrs
