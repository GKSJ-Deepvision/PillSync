from pydantic import BaseModel


class AdherenceResponse(BaseModel):
    total_doses: int
    taken_doses: int
    missed_doses: int
    snoozed_doses: int
    adherence_percentage: float