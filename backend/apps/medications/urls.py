from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DosageScheduleViewSet,
    MarkDoseSkippedAPIView,
    MarkDoseSnoozedAPIView,
    MarkDoseTakenAPIView,
    MedicationHistoryAPIView,
    MedicationViewSet,
    TodayScheduleAPIView,
)

router = DefaultRouter()
router.register(r"schedules", DosageScheduleViewSet, basename="schedule")
router.register(r"", MedicationViewSet, basename="medication")

urlpatterns = [
    path("today-schedule", TodayScheduleAPIView.as_view(), name="today-schedule"),
    path("today-schedule/", TodayScheduleAPIView.as_view(), name="today-schedule-slash"),
    path("today", TodayScheduleAPIView.as_view(), name="today-schedule-alt"),
    path("today/", TodayScheduleAPIView.as_view(), name="today-schedule-alt-slash"),
    path("doses/<int:schedule_id>/take", MarkDoseTakenAPIView.as_view(), name="dose-take"),
    path("doses/<int:schedule_id>/take/", MarkDoseTakenAPIView.as_view(), name="dose-take-slash"),
    path("doses/<int:schedule_id>/taken", MarkDoseTakenAPIView.as_view(), name="dose-taken"),
    path("doses/<int:schedule_id>/taken/", MarkDoseTakenAPIView.as_view(), name="dose-taken-slash"),
    path("doses/<int:schedule_id>/skip", MarkDoseSkippedAPIView.as_view(), name="dose-skip"),
    path("doses/<int:schedule_id>/skip/", MarkDoseSkippedAPIView.as_view(), name="dose-skip-slash"),
    path("doses/<int:schedule_id>/snooze", MarkDoseSnoozedAPIView.as_view(), name="dose-snooze"),
    path("doses/<int:schedule_id>/snooze/", MarkDoseSnoozedAPIView.as_view(), name="dose-snooze-slash"),
    path("history", MedicationHistoryAPIView.as_view(), name="medication-history-nested"),
    path("history/", MedicationHistoryAPIView.as_view(), name="medication-history-nested-slash"),
    path("", include(router.urls)),
]
