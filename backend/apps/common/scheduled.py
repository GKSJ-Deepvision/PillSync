"""Run the scheduled jobs from an HTTP call, for hosts with no background worker.

Normally Celery beat triggers these tasks and a worker runs them. Free hosting tiers
have neither, so an external cron service (cron-job.org and similar) calls this
endpoint instead, and the tasks run inside the web process. It does exactly what
beat would - the same task functions - only triggered from outside.

    POST /internal/run-jobs/?group=frequent    every 5 minutes: reminders, missed-dose sweep
    POST /internal/run-jobs/?group=daily       once a day: dose generation, refill forecasts,
                                               prescription expiry, scan cleanup
    header:  X-Cron-Secret: <CRON_SECRET>

Fails closed: with CRON_SECRET unset the endpoint does not exist (404), so a deployment
that has a real worker exposes nothing.
"""

from __future__ import annotations

import hmac
import logging

from django.conf import settings
from django.http import Http404, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)


def _groups() -> dict:
    # Imported here: the task modules import models, which must not load at URL-import time.
    from apps.ocr.tasks import purge_stale_ocr_jobs
    from apps.refills.tasks import recompute_predictions
    from apps.reminders import tasks as reminders

    return {
        "frequent": {
            "dispatch_due_reminders": reminders.dispatch_due_reminders,
            "sweep_overdue_doses": reminders.sweep_overdue_doses,
        },
        "daily": {
            "generate_dose_events": reminders.generate_dose_events,
            "notify_expiring_prescriptions": reminders.notify_expiring_prescriptions,
            "recompute_predictions": recompute_predictions,
            "purge_stale_ocr_jobs": purge_stale_ocr_jobs,
        },
    }


@csrf_exempt
@require_POST
def run_jobs(request):
    secret = getattr(settings, "CRON_SECRET", "")
    if not secret:
        raise Http404
    supplied = request.headers.get("X-Cron-Secret", "")
    if not hmac.compare_digest(supplied.encode(), secret.encode()):
        return JsonResponse({"detail": "Invalid secret."}, status=403)

    groups = _groups()
    group = request.GET.get("group", "")
    if group not in groups:
        return JsonResponse({"detail": f"group must be one of {sorted(groups)}"}, status=400)

    results, failed = {}, False
    for name, task in groups[group].items():
        try:
            # Calling the task object runs it in-process; no broker involved.
            results[name] = task()
        except Exception:  # noqa: BLE001 - one failing job must not stop the others
            logger.exception("Scheduled job %s failed", name)
            results[name] = "failed"
            failed = True
    return JsonResponse({"group": group, "results": results}, status=500 if failed else 200)
