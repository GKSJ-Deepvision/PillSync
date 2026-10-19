from django.contrib.auth.models import Group, User
from rest_framework import serializers

from .models import CaregiverPatientAssignment


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "name", "role", "avatar", "phone")

    def get_name(self, obj):
        if obj.first_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username.split("@")[0] if "@" in obj.username else obj.username

    def get_role(self, obj):
        if getattr(obj, "_role", None):
            return obj._role
        if obj.is_superuser or obj.is_staff:
            return "admin"
        try:
            group_names = set(obj.groups.values_list("name", flat=True))
            for r in ("admin", "caregiver", "patient"):
                if r in group_names:
                    return r
        except Exception:
            pass
        email = (obj.email or obj.username or "").lower()
        if "caregiver" in email or "doctor" in email:
            return "caregiver"
        return "patient"

    def get_avatar(self, obj):
        seed = (obj.username or obj.email or str(obj.id)).replace("@", "_")
        return f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed}"

    def get_phone(self, obj):
        return "+1 (555) 234-5678"


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(required=False, default="", allow_blank=True)
    role = serializers.CharField(required=False, default="patient")

    def create(self, validated_data):
        email = validated_data["email"].strip().lower()
        password = validated_data["password"]
        name = validated_data.get("name", "").strip()
        role = validated_data.get("role", "patient").lower()

        name_parts = name.split(" ", 1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        if role == "admin":
            user.is_staff = True
            user.is_superuser = True
            user.save()

        group, _ = Group.objects.get_or_create(name=role)
        user.groups.add(group)
        user._role = role
        return user


class AssignmentSerializer(serializers.ModelSerializer):
    caregiver_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    caregiver_email = serializers.SerializerMethodField()
    patient_email = serializers.SerializerMethodField()
    caregiver_avatar = serializers.SerializerMethodField()
    patient_avatar = serializers.SerializerMethodField()
    caregiver_phone = serializers.SerializerMethodField()
    patient_phone = serializers.SerializerMethodField()

    class Meta:
        model = CaregiverPatientAssignment
        fields = [
            "id",
            "caregiver",
            "caregiver_name",
            "caregiver_email",
            "caregiver_avatar",
            "caregiver_phone",
            "patient",
            "patient_name",
            "patient_email",
            "patient_avatar",
            "patient_phone",
            "assigned_at",
            "note",
        ]

    def get_caregiver_name(self, obj):
        name = obj.caregiver.get_full_name()
        return name if name.strip() else obj.caregiver.username

    def get_patient_name(self, obj):
        name = obj.patient.get_full_name()
        return name if name.strip() else obj.patient.username

    def get_caregiver_email(self, obj):
        return obj.caregiver.email

    def get_patient_email(self, obj):
        return obj.patient.email

    def get_caregiver_avatar(self, obj):
        seed = (obj.caregiver.username or obj.caregiver.email or str(obj.caregiver.id)).replace("@", "_")
        return f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed}"

    def get_patient_avatar(self, obj):
        seed = (obj.patient.username or obj.patient.email or str(obj.patient.id)).replace("@", "_")
        return f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed}"

    def get_caregiver_phone(self, obj):
        return "+1 (555) 234-5678"

    def get_patient_phone(self, obj):
        return "+1 (555) 876-5432"
