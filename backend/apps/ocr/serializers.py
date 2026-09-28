from rest_framework import serializers


class OCRUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()
