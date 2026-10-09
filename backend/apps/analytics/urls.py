from django.urls import path

from .views import CaregiverDashboardAnalyticsView, DashboardAnalyticsView

urlpatterns = [
    path("dashboard/", DashboardAnalyticsView.as_view(), name="analytics-dashboard"),
    path(
        "caregiver/patients/<int:patient_id>/dashboard/",
        CaregiverDashboardAnalyticsView.as_view(),
        name="caregiver-patient-dashboard",
    ),
]
