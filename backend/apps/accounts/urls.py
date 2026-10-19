from django.urls import path

from .views import (
    caregiver_assignment_detail_view,
    caregiver_assignments_view,
    caregiver_patients_view,
    list_users_view,
    login_view,
    patient_caregivers_view,
    profile_view,
    register_view,
)

urlpatterns = [
    # Auth
    path("register/", register_view, name="register"),
    path("login/", login_view, name="login"),
    path("me/", profile_view, name="profile"),

    # User listing (for dropdowns)
    path("users/", list_users_view, name="user-list"),

    # Caregiver–Patient assignments
    path("assignments/", caregiver_assignments_view, name="caregiver-assignments"),
    path("assignments/<int:pk>/", caregiver_assignment_detail_view, name="caregiver-assignment-detail"),

    # Convenience lookups
    path("caregivers/<str:caregiver_id>/patients/", caregiver_patients_view, name="caregiver-patients"),
    path("patients/<str:patient_id>/caregivers/", patient_caregivers_view, name="patient-caregivers"),
]
