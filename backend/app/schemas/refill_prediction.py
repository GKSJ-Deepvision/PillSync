from datetime import date

from pydantic import BaseModel


class RefillPredictionResponse(BaseModel):
    medicine_id: int
    medicine_name: str
    current_stock: int
    daily_consumption: float
    estimated_days_remaining: int | None
    estimated_depletion_date: date | None
    recommended_refill_date: date | None
    refill_required: bool
