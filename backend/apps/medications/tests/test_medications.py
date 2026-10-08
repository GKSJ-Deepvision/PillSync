import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.medications.models import Medication


@pytest.mark.django_db
class TestMedicationsAPI:
    def setup_method(self):
        self.client = APIClient()
        self.medication = Medication.objects.create(
            name="Amoxicillin",
            dosage="500 mg",
            stock=20,
            total_stock=30,
            frequency="3 times daily",
            disease_category="Infection",
            times_of_day=["Morning", "Afternoon", "Night"],
        )

    def test_list_medications(self):
        response = self.client.get("/api/medications/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1

    def test_create_medication(self):
        payload = {
            "name": "Atorvastatin",
            "dosage": "20 mg",
            "stock": 40,
            "total_stock": 60,
            "frequency": "1 time daily",
            "disease_category": "Cholesterol",
            "times_of_day": ["Night"],
            "refill_threshold": 10,
        }
        response = self.client.post("/api/medications/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Atorvastatin"
        assert Medication.objects.filter(name="Atorvastatin").exists()

    def test_medication_detail_retrieve(self):
        response = self.client.get(f"/api/medications/{self.medication.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["name"] == "Amoxicillin"

    def test_medication_detail_update(self):
        response = self.client.put(
            f"/api/medications/{self.medication.id}/",
            {"stock": 15},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        self.medication.refresh_from_db()
        assert self.medication.stock == 15

    def test_medication_take_dose(self):
        response = self.client.post(f"/api/medications/{self.medication.id}/take-dose/")
        assert response.status_code == status.HTTP_200_OK
        self.medication.refresh_from_db()
        assert self.medication.stock == 20
        assert response.json()["status"] == "taken"

    def test_medication_detail_delete(self):
        response = self.client.delete(f"/api/medications/{self.medication.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Medication.objects.filter(id=self.medication.id).exists()

    def test_fda_drug_search(self):
        response = self.client.get("/api/medications/fda-search/?q=aspirin")
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.json()
