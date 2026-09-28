from django.urls import path

from apps.notifications.views import (
    MarkAllNotificationsReadView,
    MarkNotificationReadView,
    NotificationListView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("<int:pk>/read/", MarkNotificationReadView.as_view(), name="notification-read"),
    path(
        "mark-all-read/", MarkAllNotificationsReadView.as_view(), name="notification-mark-all-read"
    ),
]
