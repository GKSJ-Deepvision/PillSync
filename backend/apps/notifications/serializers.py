from rest_framework import serializers

from .models import DeviceToken


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = [
            "id",
            "token",
            "device_type",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
