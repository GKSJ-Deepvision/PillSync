"""OCR routes."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ExtractedMedicineViewSet, OCRJobViewSet

router = DefaultRouter()
router.register("jobs", OCRJobViewSet, basename="ocr-job")
router.register("items", ExtractedMedicineViewSet, basename="ocr-item")

urlpatterns = [path("", include(router.urls))]
