"""Medicine and schedule routes."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MedicationScheduleViewSet, MedicineViewSet

router = DefaultRouter()
router.register("medicines", MedicineViewSet, basename="medicine")
router.register("schedules", MedicationScheduleViewSet, basename="schedule")

urlpatterns = [path("", include(router.urls))]
