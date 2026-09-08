from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MedicationScheduleListCreateView, MedicationViewSet

router = DefaultRouter()
router.register("", MedicationViewSet, basename="medication")

urlpatterns = [
    path(
        "<int:medication_id>/schedules/",
        MedicationScheduleListCreateView.as_view(),
        name="medication-schedules",
    ),
    path("", include(router.urls)),
]
