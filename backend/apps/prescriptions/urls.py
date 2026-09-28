from django.urls import path

from apps.prescriptions.views import PrescriptionListCreateView

urlpatterns = [
    path(
        "",
        PrescriptionListCreateView.as_view(),
        name="prescription-list-create",
    ),
]
