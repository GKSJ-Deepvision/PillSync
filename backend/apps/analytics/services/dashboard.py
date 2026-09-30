"""The numbers behind the three dashboards: patient, caregiver and administrator.

Everything here reads from the tables the other apps already keep. There is no
analytics database and no nightly roll-up: at this scale a handful of indexed
aggregate queries per page load is cheaper than the staleness and machinery a
warehouse would bring. (See docs/performance.md for the measured cost.)
"""

from __future__ import annotations

from collections import Counter
from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.utils import timezone

from apps.adherence import engine as adherence_engine
from apps.adherence.services import reports
from apps.common.choices import (
    AssignmentStatus,
    DoseStatus,
    NotificationStatus,
    UserRole,
)
from apps.refills.engine import STATUS_LEVEL
from apps.refills.models import RefillPrediction
from apps.reminders.models import DoseEvent

URGENT_REFILLS_SHOWN = 5


def _refill_rows(patients, limit: int = URGENT_REFILLS_SHOWN) -> dict:
    predictions = list(
        RefillPrediction.objects.filter(
            patient__in=patients, medicine__is_active=True
        ).select_related("medicine", "patient")
    )
    counts = Counter(p.status for p in predictions)
    needing = sorted(
        (p for p in predictions if STATUS_LEVEL.get(p.status, 0) > 0),
        key=lambda p: (-STATUS_LEVEL[p.status], p.depletion_date or timezone.localdate()),
    )
    return {
        "counts": {
            status: counts.get(status, 0)
            for status in ("OUT", "CRITICAL", "LOW", "OK", "COVERED", "UNKNOWN")
        },
        "needs_attention": len(needing),
        "urgent": [
            {
                "prediction": str(p.pk),
                "medicine": p.medicine.display_name,
                "patient": p.patient.full_name,
                "status": p.status,
                "days_remaining": float(p.days_remaining) if p.days_remaining is not None else None,
                "depletion_date": p.depletion_date,
                "recommended_refill_date": p.recommended_refill_date,
            }
            for p in needing[:limit]
        ],
    }


def _today_doses(patients, today) -> dict:
    doses = DoseEvent.objects.filter(patient__in=patients).on_day(today)
    by_status = {row["status"]: row["n"] for row in doses.values("status").annotate(n=Count("id"))}
    upcoming = (
        doses.filter(status__in=[DoseStatus.PENDING, DoseStatus.SNOOZED])
        .select_related("medicine", "patient")
        .order_by("scheduled_for")
        .first()
    )
    return {
        "total": sum(by_status.values()),
        "taken": by_status.get(DoseStatus.TAKEN, 0),
        "missed": by_status.get(DoseStatus.MISSED, 0),
        "skipped": by_status.get(DoseStatus.SKIPPED, 0),
        "remaining": by_status.get(DoseStatus.PENDING, 0) + by_status.get(DoseStatus.SNOOZED, 0),
        "next": (
            {
                "medicine": upcoming.medicine.display_name,
                "patient": upcoming.patient.full_name,
                "at": upcoming.scheduled_for,
                "slot": upcoming.slot,
            }
            if upcoming
            else None
        ),
    }


def patient_dashboard(patients, *, today=None) -> dict:
    """The headline view: today, how it is going, and what needs doing."""
    today = today or timezone.localdate()
    windows = reports.summaries(patients, (7, 30), today=today)
    week, month = windows[7], windows[30]
    from apps.medications.models import Medicine

    return {
        "today": _today_doses(patients, today),
        "adherence": {
            "week": week["adherence_rate"],
            "month": month["adherence_rate"],
            "on_time_rate": month["on_time_rate"],
            "consistency": month["consistency"],
            "streaks": month["streaks"],
            "trend": month["trend"],
        },
        "daily": month["daily"],
        "missed_insights": month["missed_analysis"]["insights"],
        "refills": _refill_rows(patients),
        "active_medicines": Medicine.objects.filter(patient__in=patients, is_active=True).count(),
    }


def caregiver_overview(user, *, today=None) -> dict:
    """One row per patient the caregiver looks after, worst-off first.

    A caregiver with six patients cannot open six dashboards; the point of this
    view is to say which one to phone first.
    """
    from apps.accounts.models import CaregiverAssignment
    from apps.profiles.models import PatientProfile

    today = today or timezone.localdate()
    assignments = CaregiverAssignment.objects.filter(
        caregiver=user, status=AssignmentStatus.ACTIVE
    ).select_related("patient")
    profiles = PatientProfile.objects.filter(user__in=[a.patient for a in assignments])

    rows = []
    for profile in profiles:
        one = PatientProfile.objects.filter(pk=profile.pk)
        # Headline rate over a week, but the *trend* over a fortnight: a week split in
        # halves is three or four days each, too few doses to call a direction.
        windows = reports.summaries(one, (7, 14), today=today)
        week = windows[7]
        week["trend"] = windows[14]["trend"]
        doses = _today_doses(one, today)
        refills = _refill_rows(one, limit=3)
        rows.append(
            {
                "patient": str(profile.pk),
                "name": profile.full_name,
                "adherence_week": week["adherence_rate"],
                "streak": week["streaks"]["current"],
                "trend": week["trend"]["direction"],
                "today": doses,
                "missed_today": doses["missed"],
                "refills_needing_attention": refills["needs_attention"],
                "refills": refills["urgent"],
                "attention": _attention(week["adherence_rate"], doses["missed"], refills),
            }
        )

    rows.sort(key=lambda r: (-r["attention"]["score"], r["name"]))
    return {
        "patients": rows,
        "totals": {
            "patients": len(rows),
            "needing_attention": sum(1 for r in rows if r["attention"]["score"] > 0),
        },
    }


def _attention(rate, missed_today: int, refills: dict) -> dict:
    """A small, explainable score - each reason is listed so it can be shown."""
    reasons, score = [], 0
    if rate is not None and rate < 70:
        reasons.append(f"Adherence is {rate:.0f}% this week")
        score += 3
    elif rate is not None and rate < 85:
        reasons.append(f"Adherence is {rate:.0f}% this week")
        score += 1
    if missed_today:
        reasons.append(f"{missed_today} dose{'s' if missed_today != 1 else ''} missed today")
        score += 2
    out = refills["counts"]["OUT"] + refills["counts"]["CRITICAL"]
    if out:
        reasons.append(f"{out} medicine{'s' if out != 1 else ''} about to run out")
        score += 3
    elif refills["counts"]["LOW"]:
        reasons.append("A refill is due soon")
        score += 1
    return {"score": score, "reasons": reasons}


def admin_overview(*, today=None) -> dict:
    """Platform-wide health: who uses it, whether it works, whether it helps."""
    from apps.accounts.models import User
    from apps.medications.models import Medicine
    from apps.notifications.models import NotificationLog
    from apps.ocr.models import JobStatus, OCRJob
    from apps.profiles.models import PatientProfile

    today = today or timezone.localdate()
    now = timezone.now()
    month_ago = now - timedelta(days=30)
    week_ago = now - timedelta(days=7)

    roles = {row["role"]: row["n"] for row in User.objects.values("role").annotate(n=Count("id"))}

    dose_stats = DoseEvent.objects.filter(
        scheduled_for__gte=month_ago, scheduled_for__lt=now
    ).aggregate(
        taken=Count("id", filter=Q(status=DoseStatus.TAKEN)),
        missed=Count("id", filter=Q(status=DoseStatus.MISSED)),
        skipped=Count("id", filter=Q(status=DoseStatus.SKIPPED)),
    )
    resolved = dose_stats["taken"] + dose_stats["missed"]

    notifications = {
        row["status"]: row["n"]
        for row in NotificationLog.objects.filter(created_at__gte=month_ago)
        .values("status")
        .annotate(n=Count("id"))
    }
    attempted = notifications.get(NotificationStatus.SENT, 0) + notifications.get(
        NotificationStatus.FAILED, 0
    )

    channels = {}
    for row in (
        NotificationLog.objects.filter(created_at__gte=month_ago)
        .values("channel")
        .annotate(
            sent=Count("id", filter=Q(status=NotificationStatus.SENT)),
            failed=Count("id", filter=Q(status=NotificationStatus.FAILED)),
        )
    ):
        total = row["sent"] + row["failed"]
        channels[row["channel"]] = {
            "sent": row["sent"],
            "failed": row["failed"],
            "delivery_rate": adherence_engine.pct(row["sent"], total),
        }

    ocr = OCRJob.objects.filter(created_at__gte=month_ago).aggregate(
        total=Count("id"),
        completed=Count("id", filter=Q(status__in=[JobStatus.COMPLETED, JobStatus.CONFIRMED])),
        confirmed=Count("id", filter=Q(status=JobStatus.CONFIRMED)),
        failed=Count("id", filter=Q(status=JobStatus.FAILED)),
        average_confidence=Avg(
            "confidence", filter=Q(status__in=[JobStatus.COMPLETED, JobStatus.CONFIRMED])
        ),
        average_ms=Avg("processing_ms"),
    )

    all_patients = PatientProfile.objects.all()
    refills = _refill_rows(all_patients, limit=0)

    from apps.refills.services import backtest

    accuracy = backtest.consumption_backtest(
        Medicine.objects.filter(is_active=True).prefetch_related("schedules")[:200], today
    )

    return {
        "generated_at": now,
        "users": {
            "total": sum(roles.values()),
            "patients": roles.get(UserRole.PATIENT, 0),
            "caregivers": roles.get(UserRole.CAREGIVER, 0),
            "admins": roles.get(UserRole.ADMIN, 0),
            "new_last_30_days": User.objects.filter(date_joined__gte=month_ago).count(),
        },
        "engagement": {
            "patient_profiles": all_patients.count(),
            "active_medicines": Medicine.objects.filter(is_active=True).count(),
            "patients_with_activity_7d": DoseEvent.objects.filter(
                responded_at__gte=week_ago, status__in=[DoseStatus.TAKEN, DoseStatus.SKIPPED]
            )
            .values("patient")
            .distinct()
            .count(),
        },
        "doses": {
            **dose_stats,
            "adherence_rate": adherence_engine.pct(dose_stats["taken"], resolved),
        },
        "notifications": {
            "by_status": notifications,
            "delivery_rate": adherence_engine.pct(
                notifications.get(NotificationStatus.SENT, 0), attempted
            ),
            "by_channel": channels,
        },
        "ocr": {
            **ocr,
            "success_rate": adherence_engine.pct(ocr["completed"], ocr["total"]),
            "confirm_rate": adherence_engine.pct(ocr["confirmed"], ocr["completed"]),
            "average_confidence": (
                round(ocr["average_confidence"], 3)
                if ocr["average_confidence"] is not None
                else None
            ),
            "average_ms": round(ocr["average_ms"]) if ocr["average_ms"] is not None else None,
        },
        "refills": {"counts": refills["counts"], "needs_attention": refills["needs_attention"]},
        "refill_forecast_accuracy": accuracy,
    }
