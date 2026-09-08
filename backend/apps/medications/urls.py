from rest_framework.routers import DefaultRouter

from .views import MedicationScheduleViewSet, MedicineViewSet

router = DefaultRouter()
router.register(r"schedules", MedicationScheduleViewSet, basename="medication-schedule")
router.register(r"", MedicineViewSet, basename="medicine")

urlpatterns = router.urls
