from django.urls import path

from apps.ocr.views import OcrConfirmView, OcrScanView

urlpatterns = [
    path("scan/", OcrScanView.as_view(), name="ocr-scan"),
    path("confirm/", OcrConfirmView.as_view(), name="ocr-confirm"),
]
