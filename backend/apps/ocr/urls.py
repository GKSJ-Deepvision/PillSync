from django.urls import path

from .views import PrescriptionScanUploadView

urlpatterns = [
    path("scan/", PrescriptionScanUploadView.as_view(), name="ocr-scan"),
]
