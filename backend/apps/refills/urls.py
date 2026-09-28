from django.urls import path

from apps.refills.views import (
    LowStockAlertsView,
    RefillPredictionsView,
    RequestRefillView,
    StockUpdateView,
)

urlpatterns = [
    path("predictions/", RefillPredictionsView.as_view(), name="refill-predictions"),
    path("low-stock/", LowStockAlertsView.as_view(), name="refill-low-stock"),
    path("update-stock/", StockUpdateView.as_view(), name="refill-update-stock"),
    path("request-refill/", RequestRefillView.as_view(), name="refill-request"),
]
