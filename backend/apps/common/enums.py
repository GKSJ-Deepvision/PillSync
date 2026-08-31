"""Enums shared by more than one app's models.

Kept in `common` (rather than in `accounts` or `medications`) specifically to
avoid the cross-app import cycles the `apps/common/README.md` warns about —
e.g. `medications` needs `AdherenceStatus`-adjacent enums without importing
the `adherence` app.
"""

from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    PATIENT = "PATIENT"
    CAREGIVER = "CAREGIVER"
    ADMIN = "ADMIN"


class CaregiverAccessLevel(str, enum.Enum):
    VIEW_ONLY = "VIEW_ONLY"
    MANAGE_MEDICATIONS = "MANAGE_MEDICATIONS"
    FULL_ACCESS = "FULL_ACCESS"


class CaregiverMappingStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class MedicineForm(str, enum.Enum):
    TABLET = "TABLET"
    CAPSULE = "CAPSULE"
    SYRUP = "SYRUP"
    INJECTION = "INJECTION"
    DROPS = "DROPS"
    INHALER = "INHALER"
    OTHER = "OTHER"


class ReminderFrequency(str, enum.Enum):
    ONCE_DAILY = "ONCE_DAILY"
    TWICE_DAILY = "TWICE_DAILY"
    THREE_TIMES_DAILY = "THREE_TIMES_DAILY"
    WEEKLY = "WEEKLY"
    AS_NEEDED = "AS_NEEDED"
    CUSTOM = "CUSTOM"


class AdherenceStatus(str, enum.Enum):
    TAKEN = "TAKEN"
    MISSED = "MISSED"
    SNOOZED = "SNOOZED"
