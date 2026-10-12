from django.urls import path

from apps.accounts.health import HealthView
from apps.accounts.views import (
    AdminOnlyView,
    CaregiverOnlyView,
    LoginView,
    MeView,
    PatientOnlyView,
    RegisterView,
    UserDetailUpdateView,
    UserListView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/<int:pk>/", UserDetailUpdateView.as_view(), name="user-detail-update"),
    path("patient-only/", PatientOnlyView.as_view(), name="patient-only"),
    path("caregiver-only/", CaregiverOnlyView.as_view(), name="caregiver-only"),
    path("admin-only/", AdminOnlyView.as_view(), name="admin-only"),
    path("health/", HealthView.as_view(), name="health"),
]
