from datetime import datetime, timedelta


class RefillEngine:
    """
    Refill forecasting engine that computes stock depletion based on
    scheduled frequencies, observed adherence history, and dose amounts.
    """

    @classmethod
    def calculate_refill_forecast(
        cls,
        stock_remaining: int,
        daily_dosage_frequency: float = 1.0,
        quantity_per_dose: float = 1.0,
        missed_doses: int = 0,
        threshold_days: int = 7,
    ) -> dict:
        daily_consumption = max(0.1, daily_dosage_frequency * quantity_per_dose)
        effective_stock = max(0, stock_remaining + (missed_doses * quantity_per_dose))

        days_remaining = round(effective_stock / daily_consumption, 1)
        refill_needed = days_remaining <= threshold_days

        projected_date = datetime.now() + timedelta(days=days_remaining)

        return {
            "current_stock": stock_remaining,
            "daily_consumption": daily_consumption,
            "days_remaining": days_remaining,
            "refill_needed": refill_needed,
            "threshold_days": threshold_days,
            "projected_depletion_date": projected_date.strftime("%Y-%m-%d"),
            "status": "CRITICAL" if days_remaining <= 3 else "LOW" if refill_needed else "GOOD",
        }
