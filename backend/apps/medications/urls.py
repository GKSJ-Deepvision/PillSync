from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import DosageViewSet, MedicationScheduleViewSet, MedicineViewSet

router = DefaultRouter()

router.register("", MedicineViewSet, basename="medicine")
router.register("dosages", DosageViewSet, basename="dosage")
router.register("schedules", MedicationScheduleViewSet, basename="schedule")

urlpatterns = [
    path(
        "medicines/",
        MedicineViewSet.as_view({"get": "list"}),
        name="medicine-list",
    ),
]

urlpatterns += router.urls
