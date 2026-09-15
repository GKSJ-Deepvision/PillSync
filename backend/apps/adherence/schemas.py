"""Request/response schemas for reminder-action logging.

Only the event-log slice of the adherence app belongs to this milestone —
percentage calculations, trends and reports (`apps/adherence/README.md`) are
Milestone 3. This is deliberately just "record what happened."
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from pydantic import BaseModel, ConfigDict, Field

from apps.common.enums import AdherenceStatus


class ReminderAction(PyEnum):
    """The three actions a patient can take on a due reminder.

    Kept distinct from `AdherenceStatus` even though the values line up
    1:1 — this is the verb a client sends ("snooze this"), `AdherenceStatus`
    is the noun stored in the log ("it was snoozed"). Collapsing them into one
    enum would make the snooze-duration field look like it belongs to Taken
    and Missed too.
    """

    TAKEN = "TAKEN"
    MISSED = "MISSED"
    SNOOZE = "SNOOZE"


_ACTION_TO_STATUS: dict[ReminderAction, AdherenceStatus] = {
    ReminderAction.TAKEN: AdherenceStatus.TAKEN,
    ReminderAction.MISSED: AdherenceStatus.MISSED,
    ReminderAction.SNOOZE: AdherenceStatus.SNOOZED,
}


def status_for_action(action: ReminderAction) -> AdherenceStatus:
    return _ACTION_TO_STATUS[action]


class ReminderActionCreate(BaseModel):
    action: ReminderAction
    snooze_minutes: int = Field(
        default=10,
        ge=1,
        le=24 * 60,
        description="Only used when action=SNOOZE. How long until the reminder is due again.",
    )


class AdherenceLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reminder_id: uuid.UUID
    user_id: uuid.UUID
    status: AdherenceStatus
    logged_at: datetime
