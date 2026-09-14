from django.urls import path

from .views import DosageListCreateView

urlpatterns = [
    path("dosages/", DosageListCreateView.as_view(), name="dosage-list-create"),
]
