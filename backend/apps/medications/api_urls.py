from django.urls import include, path

urlpatterns = [
    path("medications/", include("apps.medications.urls")),
]
