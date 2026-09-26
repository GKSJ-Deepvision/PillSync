from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

NotificationChannel = Literal["push", "email", "sms"]


class NotificationCreate(BaseModel):
    reminder_id: int | None = Field(default=None, gt=0)
    channel: NotificationChannel
    title: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1)


class NotificationResponse(BaseModel):
    id: int
    patient_id: int
    reminder_id: int | None
    channel: str
    title: str
    message: str
    status: str
    sent_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
