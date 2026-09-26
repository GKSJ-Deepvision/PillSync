from datetime import datetime

from pydantic import BaseModel


class MedicationHistoryResponse(BaseModel):
    id: int
    patient_id: int
    medicine_id: int
    medicine_name: str
    dosage: str
    scheduled_time: datetime
    action_at: datetime | None
    taken: bool
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
