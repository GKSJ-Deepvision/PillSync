"""Adherence routes."""

from django.urls import path

from .views import AdherenceReportView, AdherenceSummaryView

urlpatterns = [
    path("summary/", AdherenceSummaryView.as_view(), name="adherence-summary"),
    path("report/", AdherenceReportView.as_view(), name="adherence-report"),
]
