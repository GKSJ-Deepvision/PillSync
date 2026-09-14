from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DoseEventViewSet, MedicationHistoryView

router = DefaultRouter()
router.register("events", DoseEventViewSet, basename="dose-event")

urlpatterns = [
    path("history/", MedicationHistoryView.as_view(), name="medication-history"),
    path("", include(router.urls)),
]
