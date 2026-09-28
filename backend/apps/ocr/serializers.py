from rest_framework import serializers


class OcrScanRequestSerializer(serializers.Serializer):
    image = serializers.ImageField(required=False)
    image_base64 = serializers.CharField(required=False, allow_blank=True)
    raw_text = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs.get("image") and not attrs.get("image_base64") and not attrs.get("raw_text"):
            raise serializers.ValidationError(
                "At least one input (image, image_base64, or raw_text) must be provided."
            )
        return attrs


class OcrConfirmSerializer(serializers.Serializer):
    medicineName = serializers.CharField(max_length=255)
    dosage = serializers.CharField(max_length=100, default="500 mg")
    quantity = serializers.IntegerField(default=30)
    frequency = serializers.CharField(max_length=100, default="1 time daily")
    timesOfDay = serializers.ListField(child=serializers.CharField(), default=list)
    diseaseCategory = serializers.CharField(max_length=100, default="General")
    doctorName = serializers.CharField(max_length=255, required=False, allow_blank=True)
