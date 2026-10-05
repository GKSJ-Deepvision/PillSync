from django.urls import path
from .views import (
    PrescriptionOCRExtractView,
    PrescriptionOCRSaveView,
    PrescriptionOCRStatusView,
    PrescriptionOCRWebView
)

urlpatterns = [
    # REST API Endpoints
    path('extract/', PrescriptionOCRExtractView.as_view(), name='ocr_extract'),
    path('save/', PrescriptionOCRSaveView.as_view(), name='ocr_save'),
    path('status/', PrescriptionOCRStatusView.as_view(), name='ocr_status'),

    # Web UI Interface
    path('web/', PrescriptionOCRWebView.as_view(), name='ocr_web'),
]
