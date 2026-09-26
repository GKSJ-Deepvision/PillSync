import datetime
import math


class RefillPredictionEngine:
    @staticmethod
    def predict_depletion(
        initial_stock: int,
        daily_dosage_frequency: float = 2.0,
        quantity_per_dose: float = 1.0,
        missed_doses: int = 0,
        start_date: datetime.date | None = None,
        low_stock_threshold_days: int = 5,
        medicine_name: str = "Medication",
    ) -> dict:
        if start_date is None:
            start_date = datetime.date.today()

        daily_consumption = daily_dosage_frequency * quantity_per_dose
        if daily_consumption <= 0:
            daily_consumption = 1.0

        # Effective stock accounts for missed doses (missed dose = medication not consumed)
        effective_stock = initial_stock + (missed_doses * quantity_per_dose)

        days_remaining = max(0, math.floor(effective_stock / daily_consumption))
        depletion_date = start_date + datetime.timedelta(days=days_remaining)

        refill_lead_days = max(1, days_remaining - low_stock_threshold_days)
        recommended_refill_date = start_date + datetime.timedelta(days=refill_lead_days)

        is_low_stock = days_remaining <= low_stock_threshold_days

        warning_message = ""
        if is_low_stock:
            warning_message = (
                f"Your {medicine_name} is expected to finish in {days_remaining} days. "
                "Please arrange a refill."
            )

        return {
            "initial_stock": initial_stock,
            "current_stock": initial_stock,
            "daily_consumption": round(daily_consumption, 2),
            "days_remaining": days_remaining,
            "depletion_date": depletion_date.isoformat(),
            "recommended_refill_date": recommended_refill_date.isoformat(),
            "is_low_stock": is_low_stock,
            "warning_message": warning_message,
        }
