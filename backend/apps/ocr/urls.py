from rest_framework.routers import DefaultRouter

from .views import OCRExtractionViewSet

router = DefaultRouter()
router.register(r"", OCRExtractionViewSet, basename="ocr-extraction")

urlpatterns = router.urls
