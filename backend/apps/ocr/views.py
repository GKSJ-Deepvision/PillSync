import pytesseract
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.supabase_auth import SupabaseJWTAuthentication

from .engine.pipeline import scan_image
from .models import PrescriptionScan


class PrescriptionScanUploadView(APIView):
    """
    POST an image (multipart field "image") -> returns EVERY medicine found on it.

    * The patient is the signed-in user (from the Supabase token), never a client-sent id.
    * Printed prescriptions/labels are read with Tesseract; handwriting is sent to the vision
      reader when PILLSYNC_VISION_PROVIDER is configured. Nothing is saved as a medicine here:
      the frontend shows the result for the user to review and confirm first.
    """

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.data.get("image")
        if not image:
            return Response(
                {"detail": "An image file is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        data = image.read()
        try:
            result = scan_image(data)
        except ValueError as exc:  # wrong type, too large, unreadable
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except pytesseract.TesseractNotFoundError:
            return Response(
                {"detail": "Tesseract OCR is not installed on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        first = result["medicines"][0] if result["medicines"] else {}
        image.seek(0)
        scan = PrescriptionScan.objects.create(
            patient_id=request.user.id,
            image=image,
            source=result["source"],
            result=result,
            medicine_name=first.get("name", ""),
            dosage=first.get("strength", ""),
            quantity=str(first.get("quantity") or ""),
            frequency=str(first.get("doses_per_day") or ""),
        )
        return Response({"id": str(scan.id), **result}, status=status.HTTP_201_CREATED)
