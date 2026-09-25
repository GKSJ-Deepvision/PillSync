from datetime import datetime

from pydantic import BaseModel, Field


class ReminderCreate(BaseModel):
    dosage_schedule_id: int = Field(gt=0)
    scheduled_at: datetime


class ReminderUpdate(BaseModel):
    status: str | None = None
    snoozed_until: datetime | None = None


class ReminderResponse(BaseModel):
    id: int
    dosage_schedule_id: int
    scheduled_at: datetime
    status: str
    snoozed_until: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}