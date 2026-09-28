import pytest
from ml.src.refill_prediction.predictor import RefillPredictor
from rest_framework import status
from rest_framework.test import APIClient

from apps.medications.models import Medication


@pytest.mark.django_db
class TestRefillPredictionEngine:
    def setup_method(self):
        self.client = APIClient()
        self.predictor = RefillPredictor()
        self.medication = Medication.objects.create(
            name="BP Medicine (Amlodipine)",
            dosage="5 mg",
            stock=60,
            total_stock=60,
            frequency="2 times daily",
            times_of_day=["Morning", "Night"],
            disease_category="Blood Pressure",
        )

    def test_worked_example_60_tabs_2_per_day(self):
        # 60 tablets at 2 per day => 30 days of supply
        prediction = self.predictor.predict_refill(
            current_stock=60,
            daily_frequency=2,
            quantity_per_dose=1,
            missed_doses=0,
            refill_lead_days=5,
        )

        assert prediction["stockDays"] == 30
        assert prediction["effectiveStockDays"] == 30
        assert prediction["dailyConsumption"] == 2
        assert prediction["status"] == "SUFFICIENT"

    def test_missed_doses_extend_supply(self):
        # 4 missed doses extending supply by 2 days (since 2 tabs/day)
        prediction = self.predictor.predict_refill(
            current_stock=60,
            daily_frequency=2,
            quantity_per_dose=1,
            missed_doses=4,
            refill_lead_days=5,
        )

        assert prediction["stockDays"] == 30
        assert prediction["effectiveStockDays"] == 32

    def test_predictions_api_endpoint(self):
        response = self.client.get("/api/refills/predictions/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        assert data[0]["medicationName"] == "BP Medicine (Amlodipine)"
        assert data[0]["stockDays"] == 30

    def test_update_stock_api_endpoint(self):
        payload = {"medication_id": self.medication.id, "new_stock": 5}
        response = self.client.post("/api/refills/update-stock/", payload, format="json")
        assert response.status_code == status.HTTP_200_OK

        self.medication.refresh_from_db()
        assert self.medication.stock == 5

    def test_request_refill_api_endpoint(self):
        payload = {
            "medication_id": self.medication.id,
            "quantity": 60,
            "notes": "Urgent BP stock order",
        }
        response = self.client.post("/api/refills/request-refill/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["refill_log"]["quantity_requested"] == 60
        assert data["refill_log"]["status"] == "pending"
