"""Background OCR work."""

from __future__ import annotations

import logging
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name="ocr.process_ocr_job")
def process_ocr_job(job_id: str) -> str:
    """Run one queued job. Safe to run twice: a finished job is left alone."""
    from apps.ocr.models import JobStatus, OCRJob
    from apps.ocr.services import pipeline

    job = OCRJob.objects.filter(pk=job_id).first()
    if job is None or job.status not in {JobStatus.QUEUED, JobStatus.FAILED}:
        return "skipped"
    return pipeline.process_job(job).status


@shared_task(name="ocr.purge_stale_ocr_jobs")
def purge_stale_ocr_jobs(days: int | None = None) -> int:
    """Delete scans - and their images - that were never added to a medicine list.

    A prescription photograph is a medical record, so it is not kept longer than
    it is useful. A scan that was confirmed is left alone: its prescription owns
    the image now. Everything else - abandoned, failed, discarded - goes.
    """
    from apps.ocr.models import JobStatus, OCRJob

    days = days if days is not None else getattr(settings, "OCR_RETENTION_DAYS", 30)
    cutoff = timezone.now() - timedelta(days=days)
    stale = OCRJob.objects.filter(created_at__lt=cutoff).exclude(status=JobStatus.CONFIRMED)

    removed = 0
    for job in stale.iterator():
        if job.image:
            job.image.delete(save=False)
        job.delete()
        removed += 1
    if removed:
        logger.info("Purged %d stale OCR jobs older than %d days", removed, days)
    return removed
