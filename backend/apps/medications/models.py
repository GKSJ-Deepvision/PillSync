from django.db import models


class Medication(models.Model):
    name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100, default="500 mg")
    stock = models.IntegerField(default=30)
    total_stock = models.IntegerField(default=60)
    frequency = models.CharField(max_length=100, default="1 time daily")
    disease_category = models.CharField(max_length=100, default="General")
    times_of_day = models.JSONField(default=list)
    stock_days = models.IntegerField(default=30)
    refill_threshold = models.IntegerField(default=10)
    fda_ndc = models.CharField(max_length=100, blank=True, null=True)
    manufacturer = models.CharField(max_length=255, blank=True, null=True)
    active_ingredient = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.dosage})"

    def update_stock_days(self):
        daily_count = max(1, len(self.times_of_day))
        self.stock_days = max(0, self.stock // daily_count)
