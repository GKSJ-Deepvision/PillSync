from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.medications.models import Medication
from apps.ocr.serializers import OcrConfirmSerializer, OcrScanRequestSerializer
from apps.ocr.services.extractor import OcrService
from apps.ocr.services.parser import PrescriptionParser


class OcrScanView(APIView):
    """Scan uploaded prescription image or text and return OCR extraction results."""

    def post(self, request):
        serializer = OcrScanRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        service = OcrService()
        data = serializer.validated_data

        if data.get("image"):
            result = service.process_image_file(data["image"])
        elif data.get("image_base64"):
            result = service.process_base64_image(data["image_base64"])
        else:
            result = service.process_raw_text(data["raw_text"])

        return Response(result, status=status.HTTP_200_OK)


class OcrConfirmView(APIView):
    """Confirm extracted OCR results and save medication to database."""

    def post(self, request):
        serializer = OcrConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated = serializer.validated_data
        normalized = PrescriptionParser.validate_and_normalize(validated)

        medication = Medication.objects.create(
            name=normalized["name"],
            dosage=normalized["dosage"],
            stock=normalized["stock"],
            total_stock=normalized["total_stock"],
            frequency=normalized["frequency"],
            times_of_day=normalized["times_of_day"],
            disease_category=normalized["disease_category"],
        )
        medication.update_stock_days()
        medication.save()

        return Response(
            {
                "message": "Medication successfully added from OCR scan",
                "medication_id": medication.id,
                "name": medication.name,
                "dosage": medication.dosage,
                "stock": medication.stock,
                "stock_days": medication.stock_days,
            },
            status=status.HTTP_201_CREATED,
        )
