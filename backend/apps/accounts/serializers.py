from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name", "role", "avatar", "phone_number", "created_at"]
        read_only_fields = ["id", "created_at"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "email", "name", "password", "role"]

    def create(self, validated_data):
        email = validated_data.get("email").lower().strip()
        username = email.split("@")[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        name = validated_data.get("name", "").strip() or username.capitalize()
        user = User.objects.create_user(
            username=username,
            email=email,
            name=name,
            password=validated_data["password"],
            role=validated_data.get("role", User.Role.PATIENT),
            avatar=f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=4f46e5&color=fff",
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(required=False, allow_blank=True, default="")
