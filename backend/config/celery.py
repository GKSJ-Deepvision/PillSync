"""Celery application.

Reminders, notification delivery and refill recalculation all run out of process.
The worker is not needed for Milestone 1, but the wiring is here so Milestone 2
can add tasks without re-plumbing the project.
"""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("pillsync")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self) -> str:
    """Smoke test that the worker is reachable."""
    return f"request: {self.request!r}"
