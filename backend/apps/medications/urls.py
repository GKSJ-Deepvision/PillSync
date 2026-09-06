from rest_framework.routers import DefaultRouter

from apps.medications.views import MedicineViewSet

router = DefaultRouter()
router.register("medications", MedicineViewSet, basename="medication")

urlpatterns = router.urls
