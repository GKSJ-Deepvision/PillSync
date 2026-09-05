from rest_framework import serializers

from apps.accounts.models import User
from apps.medicines.models import Medicine, MedicineSchedule
from apps.profiles.models import Profile


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "role",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)

    class Meta:
        model = Profile
        fields = [
            "username",
            "email",
            "role",
            "phone_number",
            "date_of_birth",
            "emergency_contact_name",
            "emergency_contact_phone",
        ]


class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = [
            "id",
            "name",
            "dosage",
            "instructions",
            "quantity",
            "refill_threshold",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class MedicineScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicineSchedule
        fields = [
            "id",
            "medicine",
            "dose",
            "time",
            "frequency",
            "day_of_week",
            "start_date",
            "end_date",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "medicine",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        frequency = attrs.get(
            "frequency",
            getattr(self.instance, "frequency", None),
        )
        day_of_week = attrs.get(
            "day_of_week",
            getattr(self.instance, "day_of_week", None),
        )
        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )
        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        if frequency == MedicineSchedule.Frequency.WEEKLY and day_of_week is None:
            raise serializers.ValidationError(
                {"day_of_week": "This field is required for weekly schedules."}
            )

        if frequency == MedicineSchedule.Frequency.DAILY and day_of_week is not None:
            raise serializers.ValidationError(
                {"day_of_week": "This field must be empty for daily schedules."}
            )

        if end_date is not None and start_date is not None and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})

        return attrs
