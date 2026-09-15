"""Seeds one demo patient + medicine so the frontend has something to show.

No auth or medicine-management UI exists yet (see docs/milestones), so this
is the fastest way to get a real `user_id`/`medicine_id` pair to paste into
the Reminders demo page. Safe to run more than once — it reuses the same
demo user/medicine by email instead of creating duplicates.

Usage (from backend/, with DATABASE_URL pointing at your running Postgres):
    python -m scripts.seed_demo
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from apps.accounts.models import User
from apps.common import model_registry  # noqa: F401 -- see config/main.py for why
from apps.common.enums import UserRole
from apps.medications.models import Medicine
from config.database import session_scope

DEMO_EMAIL = "demo.patient@pillsync.local"
DEMO_MEDICINES = [
    {"name": "Metformin", "dosage": "500mg", "total_quantity": 60, "remaining_quantity": 60},
    {"name": "Atorvastatin", "dosage": "10mg", "total_quantity": 30, "remaining_quantity": 30},
]


async def seed() -> None:
    async with session_scope() as db:
        result = await db.execute(select(User).where(User.email == DEMO_EMAIL))
        user = result.scalar_one_or_none()
        if user is None:
            user = User(
                email=DEMO_EMAIL,
                hashed_password="demo-only-not-a-real-hash",
                full_name="Demo Patient",
                role=UserRole.PATIENT,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            await db.flush()

        result = await db.execute(select(Medicine).where(Medicine.user_id == user.id))
        medicines = list(result.scalars().all())
        if not medicines:
            medicines = [Medicine(user_id=user.id, **med) for med in DEMO_MEDICINES]
            db.add_all(medicines)
            await db.flush()

        for medicine in medicines:
            await db.refresh(medicine)
        await db.refresh(user)

        print("Demo data ready — paste these into the Reminders page:\n")
        print(f"  User ID:     {user.id}")
        for medicine in medicines:
            print(f"  Medicine ID: {medicine.id}   ({medicine.name} {medicine.dosage})")


if __name__ == "__main__":
    asyncio.run(seed())
