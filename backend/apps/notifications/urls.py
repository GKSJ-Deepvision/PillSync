"""Notification routes."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DeviceTokenViewSet, NotificationLogViewSet, NotificationPreferenceView

router = DefaultRouter()
router.register("devices", DeviceTokenViewSet, basename="device-token")
router.register("log", NotificationLogViewSet, basename="notification-log")

urlpatterns = [
    path("preferences/", NotificationPreferenceView.as_view(), name="notification-preferences"),
    path("", include(router.urls)),
]
