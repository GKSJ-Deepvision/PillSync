from datetime import date

from pydantic import BaseModel


class AdherenceResponse(BaseModel):
    total_doses: int
    taken_doses: int
    missed_doses: int
    snoozed_doses: int
    adherence_percentage: float


class DailyAdherenceResponse(BaseModel):
    date: date
    total_doses: int
    taken_doses: int
    missed_doses: int
    snoozed_doses: int
    adherence_percentage: float


class AdherenceTrendResponse(BaseModel):
    period_days: int
    average_adherence_percentage: float
    daily_history: list[DailyAdherenceResponse]