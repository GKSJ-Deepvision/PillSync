from django.urls import path

from .views import PatientProfileDetailView, PatientProfileListCreateView

urlpatterns = [
    path(
        "",
        PatientProfileListCreateView.as_view(),
        name="profile-list-create",
    ),
    path(
        "<int:pk>/",
        PatientProfileDetailView.as_view(),
        name="profile-detail",
    ),
]
