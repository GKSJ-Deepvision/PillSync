from rest_framework import serializers

from .models import PatientProfile


class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = [
            "id",
            "first_name",
            "last_name",
            "date_of_birth",
            "gender",
            "phone_number",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "emergency_contact_relationship",
            "medical_conditions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_date_of_birth(self, value):
        from datetime import date

        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")

        return value
