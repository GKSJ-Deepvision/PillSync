from django.urls import path

from .views import DeviceTokenView

urlpatterns = [
    path("device-token/", DeviceTokenView.as_view(), name="device-token"),
]
