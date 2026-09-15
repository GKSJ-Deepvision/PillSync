from django.db import models
from django.utils import timezone


class Medication(models.Model):
    FOOD_TIMING_CHOICES = (
        ("before_food", "Before Food"),
        ("after_food", "After Food"),
        ("with_food", "With Food"),
        ("empty_stomach", "Empty Stomach"),
        ("no_preference", "Does Not Matter"),
    )

    name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100, default="500 mg")
    stock = models.IntegerField(default=30)
    total_stock = models.IntegerField(default=60)
    frequency = models.CharField(max_length=100, default="1 time daily")
    disease_category = models.CharField(max_length=100, default="General")
    times_of_day = models.JSONField(default=list)
    food_timing = models.CharField(max_length=50, choices=FOOD_TIMING_CHOICES, default="after_food")
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(blank=True, null=True)
    timing_details = models.JSONField(default=dict, blank=True)
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

