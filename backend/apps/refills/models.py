import uuid

from django.db import models


class RefillCheck(models.Model):
    """
    A record of a refill-prediction calculation for a medication.
    medication_id refers to the medications.id row in Supabase's Postgres
    (the frontend's table), not a local Django model.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    medication_id = models.UUIDField()
    patient_id = models.UUIDField()

    quantity_on_hand = models.FloatField()
    daily_consumption = models.FloatField()

    days_remaining = models.FloatField(null=True, blank=True)
    depletion_date = models.DateField(null=True, blank=True)
    recommended_refill_date = models.DateField(null=True, blank=True)
    is_low_stock = models.BooleanField(default=False)

    checked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-checked_at"]
