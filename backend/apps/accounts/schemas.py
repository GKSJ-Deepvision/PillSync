from rest_framework import serializers

from apps.accounts.models import User, UserRole


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        max_length=128,
    )

    class Meta:
        model = User
        fields = ("email", "full_name", "password", "role")

    def create(self, validated_data):
        password = validated_data.pop("password")

        return User.objects.create_user(
            password=password,
            **validated_data,
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class TokenResponseSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    token_type = serializers.CharField(default="bearer")


class UserResponseSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=UserRole.choices)

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "role")


class RoleAccessResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    user = serializers.CharField()
    role = serializers.ChoiceField(choices=UserRole.choices)


class HealthResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
