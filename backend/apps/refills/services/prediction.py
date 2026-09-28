from typing import Any

from ml.src.refill_prediction.predictor import RefillPredictor

from apps.medications.models import Medication


class RefillPredictionService:
    def __init__(self):
        self.predictor = RefillPredictor()

    def get_medication_prediction(
        self, medication: Medication, missed_doses: int = 0
    ) -> dict[str, Any]:
        daily_freq = max(1, len(medication.times_of_day) if medication.times_of_day else 1)
        pred = self.predictor.predict_refill(
            current_stock=medication.stock,
            daily_frequency=daily_freq,
            quantity_per_dose=1,
            missed_doses=missed_doses,
            refill_lead_days=5,
        )

        pred["medicationId"] = medication.id
        pred["medicationName"] = medication.name
        pred["dosage"] = medication.dosage
        pred["totalStock"] = medication.total_stock
        pred["diseaseCategory"] = medication.disease_category
        return pred

    def get_all_predictions(self) -> list[dict[str, Any]]:
        meds = Medication.objects.all()
        return [self.get_medication_prediction(m) for m in meds]

    def get_low_stock_medications(self) -> list[dict[str, Any]]:
        meds = Medication.objects.all()
        low_stock = []
        for m in meds:
            pred = self.get_medication_prediction(m)
            if pred["isLowStock"]:
                low_stock.append(pred)
        return low_stock
