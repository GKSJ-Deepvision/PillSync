from django.conf import settings
from django.db import models


class Medicine(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="medicines",
    )
    name = models.CharField(max_length=150)
    dosage = models.CharField(max_length=100, blank=True)
    instructions = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=0)
    refill_threshold = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.user.username}"


class MedicineSchedule(models.Model):
    class Frequency(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"

    class DayOfWeek(models.IntegerChoices):
        MONDAY = 0, "Monday"
        TUESDAY = 1, "Tuesday"
        WEDNESDAY = 2, "Wednesday"
        THURSDAY = 3, "Thursday"
        FRIDAY = 4, "Friday"
        SATURDAY = 5, "Saturday"
        SUNDAY = 6, "Sunday"

    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="schedules",
    )
    dose = models.CharField(max_length=100)
    time = models.TimeField()
    frequency = models.CharField(
        max_length=20,
        choices=Frequency.choices,
        default=Frequency.DAILY,
    )
    day_of_week = models.PositiveSmallIntegerField(
        choices=DayOfWeek.choices,
        null=True,
        blank=True,
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.medicine.name} - {self.time}"
