"""URL routing for OCR endpoints."""

from django.urls import path
from apps.ocr.views import OCRScanView, SamplePrescriptionView

app_name = "ocr"

urlpatterns = [
    path("ocr/scan/", OCRScanView.as_view(), name="ocr-scan"),
    path("ocr/sample-image/", SamplePrescriptionView.as_view(), name="ocr-sample-image"),
]
