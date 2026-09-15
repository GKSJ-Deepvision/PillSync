"""Aggregates every app's router under a single `/api/v1` prefix.

Each app owns its own `routes.py` (added as that app is built out in later
milestones) and gets included here — `config/main.py` only ever mounts this
one router, so adding a new app never means touching `config/`.
"""

from __future__ import annotations

from fastapi import APIRouter

from apps.common.health import router as health_router
from apps.reminders.routes import router as reminders_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(reminders_router)

# Milestone 1+: apps.accounts.routes (auth, RBAC) — not in this milestone's scope.
# Milestone 1+: apps.profiles.routes (profile management).
# Milestone 2:  apps.medications.routes (medicine management — not picked up this
#               slice, see docs/milestones/milestone-2.md), apps.notifications.routes.
# Milestone 3:  apps.ocr.routes, apps.adherence.routes (metrics/reports), apps.refills.routes.
# Milestone 4:  apps.analytics.routes.
