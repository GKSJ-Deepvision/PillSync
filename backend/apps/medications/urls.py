from rest_framework.routers import DefaultRouter

from .views import DosageViewSet, MedicationScheduleViewSet, MedicineViewSet

router = DefaultRouter()
router.register("medicines", MedicineViewSet, basename="medicine")
router.register("dosages", DosageViewSet, basename="dosage")
router.register("schedules", MedicationScheduleViewSet, basename="schedule")

urlpatterns = router.urls
