from django.urls import path

from .views import (
    DosageAnalysisView,
    RefillPredictionDetailView,
    RefillPredictionView,
)

urlpatterns = [
    path(
        "predictions/",
        RefillPredictionView.as_view(),
        name="refill-predictions",
    ),
    path(
        "predictions/<int:medicine_id>/",
        RefillPredictionDetailView.as_view(),
        name="refill-prediction-detail",
    ),
    path(
        "dosage-analysis/",
        DosageAnalysisView.as_view(),
        name="dosage-analysis",
    ),
]
