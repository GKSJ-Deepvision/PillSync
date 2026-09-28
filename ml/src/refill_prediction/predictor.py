from datetime import datetime, timedelta
from typing import Any, Dict


class RefillPredictor:
    """AI Refill Prediction Engine for calculating medicine stock depletion and refill dates."""

    def predict_refill(
        self,
        current_stock: int,
        daily_frequency: int = 2,
        quantity_per_dose: int = 1,
        missed_doses: int = 0,
        refill_lead_days: int = 5,
        reference_date: datetime | None = None,
    ) -> Dict[str, Any]:
        if reference_date is None:
            reference_date = datetime.now()

        daily_consumption = max(1, daily_frequency * quantity_per_dose)

        # Stock days calculation: 60 tablets / 2 per day = 30 days
        stock_days = max(0, current_stock // daily_consumption)

        # Account for missed doses: missed doses mean stock lasted longer
        effective_stock_days = stock_days + (missed_doses // daily_consumption)

        depletion_date = reference_date + timedelta(days=effective_stock_days)
        recommended_refill_date = depletion_date - timedelta(days=refill_lead_days)

        # Status calculation
        if effective_stock_days <= 3:
            status = "CRITICAL"
            action = "Immediate Refill Required"
        elif effective_stock_days <= refill_lead_days:
            status = "LOW_STOCK"
            action = "Reorder Stock Today"
        elif effective_stock_days <= 10:
            status = "WARNING"
            action = "Prepare Refill Order Soon"
        else:
            status = "SUFFICIENT"
            action = "Stock Level Healthy"

        return {
            "initialQuantity": current_stock,
            "dailyConsumption": daily_consumption,
            "stockDays": stock_days,
            "effectiveStockDays": effective_stock_days,
            "missedDosesAccountedFor": missed_doses,
            "depletionDate": depletion_date.strftime("%Y-%m-%d"),
            "recommendedRefillDate": recommended_refill_date.strftime("%Y-%m-%d"),
            "status": status,
            "actionRequired": action,
            "isLowStock": effective_stock_days <= refill_lead_days,
        }
