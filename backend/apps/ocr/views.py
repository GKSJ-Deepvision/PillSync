"""Views for OCR image scanning and recognition."""

from __future__ import annotations

import os
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.http import FileResponse, Http404

from apps.ocr.serializers import OCRResultSerializer, OCRScanSerializer
from apps.ocr.services.extractor import extract_from_image_bytes


@extend_schema(tags=["ocr"])
class OCRScanView(APIView):
    """Scan an uploaded prescription or medicine label image and extract structured data."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        request=OCRScanSerializer,
        responses={200: OCRResultSerializer},
    )
    def post(self, request, *args, **kwargs):
        serializer = OCRScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        image_file = serializer.validated_data["image"]
        image_bytes = image_file.read()

        try:
            result = extract_from_image_bytes(image_bytes)
        except Exception as exc:
            return Response(
                {"error": f"Failed to process image OCR: {exc!s}"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        return Response(result, status=status.HTTP_200_OK)


@extend_schema(tags=["ocr"])
class SamplePrescriptionView(APIView):
    """Retrieve sample prescription image for instant OCR testing."""

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        sample_path = os.path.abspath(
            os.path.join(
                settings.BASE_DIR.parent,
                "ml",
                "src",
                "ocr",
                "sample_prescription.png",
            )
        )
        if not os.path.exists(sample_path):
            raise Http404("Sample prescription not found.")
        return FileResponse(open(sample_path, "rb"), content_type="image/png")
