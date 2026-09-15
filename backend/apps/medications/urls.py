from django.urls import path

from .views import fda_drug_search, medication_detail, medication_list_create, mongo_store_view, take_dose

urlpatterns = [
    path("", medication_list_create, name="medication-list-create"),
    path("fda-search/", fda_drug_search, name="fda-drug-search"),
    path("mongo-store/", mongo_store_view, name="mongo-store"),
    path("<int:pk>/", medication_detail, name="medication-detail"),
    path("<int:pk>/take-dose/", take_dose, name="take-dose"),
]
