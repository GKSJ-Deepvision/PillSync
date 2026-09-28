"""Serializers for OCR scanning and data extraction."""

from __future__ import annotations

from rest_framework import serializers

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class OCRScanSerializer(serializers.Serializer):
    image = serializers.ImageField(required=True)

    def validate_image(self, value):
        content_type = getattr(value, "content_type", "")
        if content_type and content_type.lower() not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError(
                f"Unsupported image format ({content_type}). Allowed types: JPG, PNG, WEBP."
            )
        if value.size > MAX_FILE_SIZE_BYTES:
            raise serializers.ValidationError("Image file size exceeds the 10MB limit.")
        return value


class OCRResultSerializer(serializers.Serializer):
    raw_text = serializers.CharField(allow_blank=True)
    confidence = serializers.FloatField()
    medicine_name = serializers.CharField(allow_null=True, required=False)
    dosage = serializers.CharField(allow_null=True, required=False)
    quantity = serializers.IntegerField(allow_null=True, required=False)
    frequency = serializers.CharField(allow_null=True, required=False)
    prescription_details = serializers.CharField(allow_null=True, required=False)
