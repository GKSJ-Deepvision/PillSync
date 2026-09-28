from django.urls import path

from apps.adherence.views import AdherenceHistoryView, AdherenceMetricsView, LogAdherenceView

urlpatterns = [
    path("metrics/", AdherenceMetricsView.as_view(), name="adherence-metrics"),
    path("history/", AdherenceHistoryView.as_view(), name="adherence-history"),
    path("log/", LogAdherenceView.as_view(), name="adherence-log"),
]
