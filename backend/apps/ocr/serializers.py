from rest_framework import serializers

from .models import OCRExtractionLog


class OCRExtractionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = OCRExtractionLog
        fields = "__all__"
