from django.urls import path

from .views import RefillPredictionView, RefillRequestListCreateView

urlpatterns = [
    path("", RefillRequestListCreateView.as_view(), name="refill-list-create"),
    path("predict/<int:medicine_id>/", RefillPredictionView.as_view(), name="refill-predict"),
]
