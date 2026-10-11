from rest_framework import serializers

from .models import EmergencyContact, MedicalCondition, PatientProfile


class MedicalConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalCondition
        fields = "__all__"


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = "__all__"


class PatientProfileSerializer(serializers.ModelSerializer):
    conditions = MedicalConditionSerializer(many=True, read_only=True)
    emergency_contacts = EmergencyContactSerializer(many=True, read_only=True)

    class Meta:
        model = PatientProfile
        fields = "__all__"
