from django.urls import path

from .views import fda_drug_search, medication_detail, medication_list_create, take_dose

urlpatterns = [
    path("", medication_list_create, name="medication-list-create"),
    path("fda-search/", fda_drug_search, name="fda-drug-search"),
    path("<int:pk>/", medication_detail, name="medication-detail"),
    path("<int:pk>/take-dose/", take_dose, name="take-dose"),
]
