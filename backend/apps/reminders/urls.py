from django.urls import path
from apps.medications.views import (
    MarkDoseSkippedAPIView,
    MarkDoseSnoozedAPIView,
    MarkDoseTakenAPIView,
    TodayScheduleAPIView,
)

urlpatterns = [
    path("today", TodayScheduleAPIView.as_view(), name="reminders-today"),
    path("today/", TodayScheduleAPIView.as_view(), name="reminders-today-slash"),
    path("<int:schedule_id>/taken", MarkDoseTakenAPIView.as_view(), name="reminders-taken"),
    path("<int:schedule_id>/taken/", MarkDoseTakenAPIView.as_view(), name="reminders-taken-slash"),
    path("<int:schedule_id>/missed", MarkDoseSkippedAPIView.as_view(), name="reminders-missed"),
    path("<int:schedule_id>/missed/", MarkDoseSkippedAPIView.as_view(), name="reminders-missed-slash"),
    path("<int:schedule_id>/snooze", MarkDoseSnoozedAPIView.as_view(), name="reminders-snooze"),
    path("<int:schedule_id>/snooze/", MarkDoseSnoozedAPIView.as_view(), name="reminders-snooze-slash"),
    path("", TodayScheduleAPIView.as_view(), name="reminders-root"),
]
