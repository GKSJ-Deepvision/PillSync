from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "name", "role")

    def get_name(self, obj):
        if obj.first_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username.split("@")[0] if "@" in obj.username else obj.username

    def get_role(self, obj):
        if getattr(obj, "_role", None):
            return obj._role
        if obj.is_superuser or obj.is_staff:
            return "admin"
        email = (obj.email or obj.username or "").lower()
        if "caregiver" in email or "doctor" in email:
            return "caregiver"
        return "patient"


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

        user._role = role
        return user
