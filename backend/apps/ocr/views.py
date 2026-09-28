from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import OCRUploadSerializer
from .services.extractor import extract_text
from .services.parser import parse_ocr_text


class OCRView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = OCRUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        image = serializer.validated_data["image"]

        try:
            raw_text = extract_text(image)
            parsed_data = parse_ocr_text(raw_text)

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
