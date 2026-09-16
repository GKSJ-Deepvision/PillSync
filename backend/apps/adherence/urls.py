from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    AdherenceSummaryAPIView,
    AdherenceWeeklyAPIView,
    DoseEventViewSet,
    MedicationAdherenceHistoryAPIView,
    MedicationHistoryView,
)

router = DefaultRouter()
router.register(r"events", DoseEventViewSet, basename="dose-event")

urlpatterns = [
    path("summary", AdherenceSummaryAPIView.as_view(), name="adherence-summary"),
    path("summary/", AdherenceSummaryAPIView.as_view(), name="adherence-summary-slash"),
    path("weekly", AdherenceWeeklyAPIView.as_view(), name="adherence-weekly"),
    path("weekly/", AdherenceWeeklyAPIView.as_view(), name="adherence-weekly-slash"),
    path("history", MedicationHistoryView.as_view(), name="adherence-history"),
    path("history/", MedicationHistoryView.as_view(), name="adherence-history-slash"),
    path("overview", MedicationAdherenceHistoryAPIView.as_view(), name="adherence-overview"),
    path("overview/", MedicationAdherenceHistoryAPIView.as_view(), name="adherence-overview-slash"),
    path("", include(router.urls)),
]
