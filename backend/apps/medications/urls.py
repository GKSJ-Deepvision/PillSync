from django.urls import path
from .views import medication_list_create, medication_detail, take_dose, fda_drug_search

urlpatterns = [
    path("", medication_list_create, name="medication-list-create"),
    path("fda-search/", fda_drug_search, name="fda-drug-search"),
    path("<int:pk>/", medication_detail, name="medication-detail"),
    path("<int:pk>/take-dose/", take_dose, name="take-dose"),
]
