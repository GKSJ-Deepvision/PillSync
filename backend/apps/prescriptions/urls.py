from rest_framework.routers import DefaultRouter

from .views import PrescriptionViewSet

router = DefaultRouter()
router.register(r"", PrescriptionViewSet, basename="prescription")

urlpatterns = router.urls
