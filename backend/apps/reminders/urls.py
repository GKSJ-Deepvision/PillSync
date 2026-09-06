from django.urls import path

from .views import (
    ReminderListView,
    ReminderStatusUpdateView,
    TodayReminderListView,
    UpcomingReminderListView,
)

urlpatterns = [
    path("", ReminderListView.as_view(), name="reminder-list"),
    path("today/", TodayReminderListView.as_view(), name="reminder-today"),
    path(
        "upcoming/",
        UpcomingReminderListView.as_view(),
        name="reminder-upcoming",
    ),
    path(
        "<int:pk>/status/",
        ReminderStatusUpdateView.as_view(),
        name="reminder-status-update",
    ),
]
