from django.urls import path

from .views import RefillPredictionView, StockUpdateView


urlpatterns = [
    path(
        "prediction/<int:medicine_id>/",
        RefillPredictionView.as_view(),
        name="refill-prediction",
    ),
    path(
        "stock/<int:medicine_id>/",
        StockUpdateView.as_view(),
        name="stock-update",
    ),
]