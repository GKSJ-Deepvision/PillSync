from django.urls import path

from .views import AdminOCRMonitoringView, PrescriptionScanUploadView

urlpatterns = [
    path("scan/", PrescriptionScanUploadView.as_view(), name="ocr-scan"),
    path(
        "admin-monitoring/",
        AdminOCRMonitoringView.as_view(),
        name="ocr-admin-monitoring",
    ),
]
