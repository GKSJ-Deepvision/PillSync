from django.urls import path

from .views import RefillPredictionView

urlpatterns = [
    path(
        "medicines/<int:medicine_id>/prediction/",
        RefillPredictionView.as_view(),
        name="refill-prediction",
    ),
]
