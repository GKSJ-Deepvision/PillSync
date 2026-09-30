"""Serializers for OCR jobs and their extracted medicines."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.urls import reverse
from PIL import Image, UnidentifiedImageError
from rest_framework import serializers

from apps.common.choices import DoseSlot, ScheduleFrequency
from apps.common.models import MedicineReference
from apps.profiles.models import PatientProfile

from .models import ExtractedMedicine, ItemStatus, JobKind, MatchLevel, OCRJob

ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP", "TIFF"}
MIN_IMAGE_SIDE = 200
MAX_TEXT_CHARS = 20_000


class ExtractedMedicineSerializer(serializers.ModelSerializer):
    reference_label = serializers.SerializerMethodField()
    confidence_band = serializers.SerializerMethodField()
    match_level_display = serializers.CharField(source="get_match_level_display", read_only=True)

    class Meta:
        model = ExtractedMedicine
        fields = (
            "id",
            "position",
            "raw_line",
            "name",
            "form",
            "strength",
            "strength_unit",
            "slots",
            "frequency",
            "interval_days",
            "days_of_week",
            "as_needed",
            "duration_days",
            "total_quantity",
            "instructions",
            "reference",
            "reference_label",
            "match_level",
            "match_level_display",
            "match_score",
            "suggestions",
            "confidence",
            "confidence_band",
            "reasons",
            "status",
            "medicine",
        )
        read_only_fields = (
            "id",
            "position",
            "raw_line",
            "match_level",
            "match_score",
            "suggestions",
            "confidence",
            "reasons",
            "medicine",
        )

    def get_reference_label(self, obj: ExtractedMedicine) -> str | None:
        return str(obj.reference) if obj.reference_id else None

    def get_confidence_band(self, obj: ExtractedMedicine) -> str:
        """A word for the number, so the interface need not guess thresholds."""
        if obj.confidence >= 0.75:
            return "HIGH"
        return "MEDIUM" if obj.confidence >= 0.5 else "LOW"


class ExtractedMedicineUpdateSerializer(ExtractedMedicineSerializer):
    """What a patient may correct on the review screen."""

    class Meta(ExtractedMedicineSerializer.Meta):
        pass

    def validate_slots(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Slots must be a list.")
        seen = set()
        cleaned = []
        for entry in value:
            slot = entry.get("slot") if isinstance(entry, dict) else None
            if slot not in DoseSlot.values:
                raise serializers.ValidationError(f"Unknown time of day: {slot!r}.")
            if slot in seen:
                raise serializers.ValidationError(f"{slot.title()} is listed twice.")
            try:
                quantity = Decimal(str(entry.get("quantity", "1")))
            except Exception as exc:  # noqa: BLE001
                raise serializers.ValidationError("Each dose needs a number of units.") from exc
            if quantity <= 0 or quantity > 100:
                raise serializers.ValidationError("A dose must be between 0 and 100 units.")
            seen.add(slot)
            cleaned.append({"slot": slot, "quantity": str(quantity.normalize())})
        return cleaned

    def validate_frequency(self, value):
        if value not in ScheduleFrequency.values:
            raise serializers.ValidationError("Unknown repeat rule.")
        return value

    def validate_days_of_week(self, value):
        if any(day not in range(1, 8) for day in value):
            raise serializers.ValidationError("Use ISO weekday numbers: Monday=1 to Sunday=7.")
        return sorted(set(value))

    def validate_status(self, value):
        # Confirmed is set by confirming the scan, never by editing one item.
        if value == ItemStatus.CONFIRMED:
            raise serializers.ValidationError("Confirm the whole scan to add its medicines.")
        return value

    def validate_reference(self, value: MedicineReference | None):
        if value is not None and not value.is_active:
            raise serializers.ValidationError("That catalogue entry is no longer available.")
        return value

    def update(self, instance: ExtractedMedicine, validated_data: dict) -> ExtractedMedicine:
        if "reference" in validated_data:
            reference = validated_data["reference"]
            if reference is not None:
                # The patient chose this entry, so it is as certain as a match gets.
                instance.match_level, instance.match_score = MatchLevel.AUTO, 1.0
                # Fill only what is blank: the prescription's own strength wins.
                if not (validated_data.get("strength") or instance.strength):
                    validated_data["strength"] = reference.strength
                    validated_data["strength_unit"] = reference.strength_unit
                if not (validated_data.get("form") or instance.form):
                    validated_data["form"] = reference.dosage_form
            else:
                instance.match_level, instance.match_score = MatchLevel.NONE, 0.0
        return super().update(instance, validated_data)


class OCRJobSerializer(serializers.ModelSerializer):
    items = ExtractedMedicineSerializer(many=True, read_only=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)
    has_image = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField(
        help_text="Authenticated endpoint. Prescription images are never served from a public path."
    )

    class Meta:
        model = OCRJob
        fields = (
            "id",
            "patient",
            "patient_name",
            "kind",
            "kind_display",
            "source",
            "status",
            "status_display",
            "engine",
            "raw_text",
            "ocr_confidence",
            "confidence",
            "header",
            "warnings",
            "error",
            "processing_ms",
            "has_image",
            "image_url",
            "prescription",
            "items",
            "created_at",
            "confirmed_at",
        )
        read_only_fields = fields

    def get_has_image(self, obj: OCRJob) -> bool:
        return bool(obj.image)

    def get_image_url(self, obj: OCRJob) -> str | None:
        return reverse("v1:ocr-job-image", args=[obj.pk]) if obj.image else None


def _validate_patient(request, value: PatientProfile) -> PatientProfile:
    if not request.user.is_admin and value.managed_by_id != request.user.id:
        raise serializers.ValidationError("You do not manage that patient profile.")
    return value


class OCRJobCreateSerializer(serializers.Serializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=PatientProfile.objects.all())
    kind = serializers.ChoiceField(choices=JobKind.choices, default=JobKind.PRESCRIPTION)
    image = serializers.ImageField()

    def validate_patient(self, value):
        return _validate_patient(self.context["request"], value)

    def validate_image(self, upload):
        limit = settings.MAX_UPLOAD_SIZE_BYTES
        if upload.size > limit:
            raise serializers.ValidationError(
                f"That file is {upload.size / 1_048_576:.1f} MB. The limit is {limit / 1_048_576:.0f} MB."
            )
        try:
            upload.seek(0)
            with Image.open(upload) as image:
                image_format, (width, height) = image.format, image.size
        except (UnidentifiedImageError, OSError) as exc:
            raise serializers.ValidationError("That file is not a readable image.") from exc
        finally:
            upload.seek(0)

        if image_format not in ALLOWED_IMAGE_FORMATS:
            raise serializers.ValidationError(
                f"{image_format or 'That'} images are not supported. Use JPEG, PNG, WEBP or TIFF."
            )
        if min(width, height) < MIN_IMAGE_SIDE:
            raise serializers.ValidationError(
                f"That image is only {width}x{height} pixels, too small to read. "
                f"Use at least {MIN_IMAGE_SIDE} pixels on each side."
            )
        # Checked from the header alone, before anything decodes the pixels: a
        # crafted file can be a few kilobytes and expand to gigabytes in memory.
        if width * height > settings.OCR_MAX_IMAGE_PIXELS:
            raise serializers.ValidationError(
                f"That image is {width}x{height} pixels, which is larger than we can process."
            )
        return upload


class ParseTextSerializer(serializers.Serializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=PatientProfile.objects.all())
    kind = serializers.ChoiceField(choices=JobKind.choices, default=JobKind.PRESCRIPTION)
    text = serializers.CharField(max_length=MAX_TEXT_CHARS, trim_whitespace=False)

    def validate_patient(self, value):
        return _validate_patient(self.context["request"], value)

    def validate_text(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Paste or type the prescription text.")
        return value


class ReparseSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=MAX_TEXT_CHARS, trim_whitespace=False)


class ConfirmItemSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    quantity_remaining = serializers.DecimalField(
        max_digits=8, decimal_places=2, min_value=Decimal("0")
    )


class ConfirmSerializer(serializers.Serializer):
    items = ConfirmItemSerializer(many=True, required=False)
