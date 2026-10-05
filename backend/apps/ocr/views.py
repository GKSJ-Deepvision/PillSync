import logging
from django.shortcuts import render
from django.views.generic import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny

from ml.src.ocr.preprocessor import ImagePreprocessor, ImageValidationError
from ml.src.ocr.engine import OCREngine, OCREngineError
from ml.src.ocr.extractor import MedicineExtractor
from .models import PrescriptionUpload
from .serializers import (
    PrescriptionUploadResponseSerializer,
    MedicationBatchSaveSerializer
)

logger = logging.getLogger(__name__)


class PrescriptionOCRExtractView(APIView):
    """
    API endpoint to upload a prescription image, run OCR recognition,
    and extract structured medication information.
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        # 1. Retrieve uploaded file from supported field names
        file_obj = (
            request.FILES.get('prescription_image') or
            request.FILES.get('image') or
            request.FILES.get('file')
        )

        if not file_obj:
            return Response(
                {
                    "success": False,
                    "error": "No prescription image was provided. Please upload a valid image file (JPG, PNG, WEBP)."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. File validation
        preprocessor = ImagePreprocessor()
        try:
            val_meta = preprocessor.validate_file(file_obj, file_obj.name)
        except ImageValidationError as e:
            return Response(
                {
                    "success": False,
                    "error": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Image Preprocessing
        try:
            binarized_img, original_img = preprocessor.preprocess(file_obj)
        except Exception as e:
            logger.error(f"Image preprocessing failure: {e}")
            return Response(
                {
                    "success": False,
                    "error": f"Failed to preprocess image: {str(e)}"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. OCR Execution
        try:
            ocr_engine = OCREngine()
            ocr_result = ocr_engine.extract_text(binarized_img, original_img)
        except OCREngineError as e:
            logger.error(f"OCR execution failure: {e}")
            return Response(
                {
                    "success": False,
                    "error": f"OCR processing failed: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        raw_text = ocr_result.get("raw_text", "").strip()
        mean_conf = ocr_result.get("mean_confidence", 0.0)
        conf_level = ocr_result.get("confidence_level", "Low")

        # 5. Handle unreadable or empty images gracefully
        if not raw_text:
            return Response(
                {
                    "success": False,
                    "raw_text": "",
                    "mean_confidence": 0.0,
                    "confidence_level": "Low",
                    "medicines": [],
                    "error": "Unable to detect any readable text in the uploaded image. Please ensure the prescription is well-lit, in focus, and clearly legible."
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        # 6. Clinical Medicine Information Extraction
        extractor = MedicineExtractor()
        extracted_medicines = extractor.extract(raw_text)

        # 7. Audit persistence (optional, fails gracefully)
        upload_record = None
        try:
            user = request.user if request.user.is_authenticated else None
            upload_record = PrescriptionUpload.objects.create(
                user=user,
                image=file_obj,
                original_filename=file_obj.name,
                raw_text=raw_text,
                status='completed' if extracted_medicines else 'failed',
                confidence=mean_conf,
                confidence_level=conf_level,
                extracted_data=extracted_medicines
            )
        except Exception as e:
            logger.warning(f"Could not save PrescriptionUpload audit record: {e}")

        # 8. Construct response message
        if extracted_medicines:
            message = f"Successfully recognized {len(extracted_medicines)} medication(s) from prescription."
        else:
            message = "Text was recognized, but no specific medications could be reliably identified. Please review raw OCR text or verify manually."

        response_payload = {
            "success": True,
            "upload_id": upload_record.id if upload_record else None,
            "raw_text": raw_text,
            "mean_confidence": mean_conf,
            "confidence_level": conf_level,
            "medicines": extracted_medicines,
            "message": message,
        }

        serializer = PrescriptionUploadResponseSerializer(data=response_payload)
        serializer.is_valid()
        return Response(serializer.data, status=status.HTTP_200_OK)


class PrescriptionOCRSaveView(APIView):
    """
    API endpoint to persist verified and reviewed medication records to the database.
    """
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]

    def post(self, request, *args, **kwargs):
        serializer = MedicationBatchSaveSerializer(
            data=request.data,
            context={'user': request.user}
        )
        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "error": "Invalid medication data provided.",
                    "details": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        saved_records = serializer.save()
        return Response(
            {
                "success": True,
                "saved_count": len(saved_records),
                "message": f"Successfully saved {len(saved_records)} medication(s) to your medication tracker."
            },
            status=status.HTTP_201_CREATED
        )


class PrescriptionOCRStatusView(APIView):
    """
    Health check endpoint reporting Tesseract OCR operational readiness.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        engine = OCREngine()
        available = engine.is_available()
        return Response({
            "status": "operational" if available else "degraded",
            "tesseract_installed": available,
            "tesseract_version": engine.version if available else "Not Found",
            "tesseract_path": engine.tesseract_cmd if available else None,
            "engine": "Tesseract OCR v5.4"
        })


class PrescriptionOCRWebView(View):
    """
    Renders the responsive Prescription OCR web user interface.
    """
    def get(self, request):
        return render(request, 'ocr/prescription_ocr.html')
