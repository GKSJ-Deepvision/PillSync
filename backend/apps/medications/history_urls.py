from django.urls import path
from .views import MedicationHistoryAPIView

urlpatterns = [
    path("", MedicationHistoryAPIView.as_view(), name="medication-history-root"),
]
