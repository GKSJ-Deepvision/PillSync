from django.urls import path

from .views import RefillCheckView

urlpatterns = [
    path("check/", RefillCheckView.as_view(), name="refill-check"),
]
