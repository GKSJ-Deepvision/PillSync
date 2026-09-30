"""Analytics routes."""

from django.urls import path

from .views import AdminOverviewView, CaregiverOverviewView, DashboardView, PerformanceView

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="analytics-dashboard"),
    path("caregiver/", CaregiverOverviewView.as_view(), name="analytics-caregiver"),
    path("admin/", AdminOverviewView.as_view(), name="analytics-admin"),
    path("performance/", PerformanceView.as_view(), name="analytics-performance"),
]
