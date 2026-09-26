from ml.src.ocr.recognizer import OCRRecognizer
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import OCRExtractionLog
from .serializers import OCRExtractionLogSerializer


class OCRExtractionViewSet(viewsets.ModelViewSet):
    queryset = OCRExtractionLog.objects.all()
    serializer_class = OCRExtractionLogSerializer

    @action(detail=False, methods=["post"])
    def extract(self, request):
        raw_text = request.data.get("raw_text", "Rx: Metformin 500mg 60 pills take twice daily")
        res = OCRRecognizer.extract_prescription_text(raw_text)
        return Response(res, status=status.HTTP_200_OK)
