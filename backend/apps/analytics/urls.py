from django.urls import path

from .views import AdherenceSummaryView, DashboardMetricsView

urlpatterns = [
    path("dashboard/", DashboardMetricsView.as_view(), name="analytics-dashboard"),
    path("adherence/", AdherenceSummaryView.as_view(), name="analytics-adherence"),
]
