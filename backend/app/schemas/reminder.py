from datetime import datetime, time

from pydantic import BaseModel


class ReminderCreate(BaseModel):
    dosage_schedule_id: int
    scheduled_at: datetime


class ReminderUpdate(BaseModel):
    status: str | None = None
    snoozed_until: datetime | None = None


class ReminderResponse(BaseModel):
    id: int
    dosage_schedule_id: int

    medicine_name: str
    medicine_dosage: str

    dosage_amount: int
    time_of_day: time
    frequency: str

    scheduled_at: datetime
    status: str
    snoozed_until: datetime | None
    action_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
