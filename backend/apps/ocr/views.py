from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .services.extractor import extract_text
from .services.parser import parse_ocr_text


class OCRView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_text = (request.data.get("raw_text") or "").strip()
        filename = request.data.get("filename", "")
        image = request.data.get("image")

        if not raw_text and image:
            try:
                filename = getattr(image, "name", "") or filename
                raw_text = extract_text(image)
            except Exception:
                raw_text = ""

        try:
            parsed_data = parse_ocr_text(raw_text, filename=filename)

            if not parsed_data.get("is_medicine", False):
                return Response(
                    {
                        "detail": parsed_data.get(
                            "error_detail",
                            "Invalid Image: PillSync only accepts images of medications, blister strips, bottles, or clinical prescriptions.",
                        ),
                        "is_medicine": False,
                        "raw_text": raw_text,
                        "data": parsed_data,
                    },
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            return Response(
                {
                    "raw_text": raw_text,
                    "data": parsed_data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
