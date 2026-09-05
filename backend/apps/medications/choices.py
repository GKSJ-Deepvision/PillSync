from django.db import models


class MedicineCategory(models.TextChoices):
    BLOOD_PRESSURE = "BLOOD_PRESSURE", "Blood Pressure"
    DIABETES = "DIABETES", "Diabetes"
    THYROID = "THYROID", "Thyroid"
    ANTIBIOTICS = "ANTIBIOTICS", "Antibiotics"
    VITAMINS = "VITAMINS", "Vitamins"
    HEART = "HEART", "Heart Medications"
    OTHER = "OTHER", "Other"


class DoseSlot(models.TextChoices):
    MORNING = "MORNING", "Morning"
    AFTERNOON = "AFTERNOON", "Afternoon"
    NIGHT = "NIGHT", "Night"


class ScheduleFrequency(models.TextChoices):
    DAILY = "DAILY", "Every day"
    SPECIFIC_DAYS = "SPECIFIC_DAYS", "On chosen days"
    INTERVAL = "INTERVAL", "Every N days"


class Weekday(models.IntegerChoices):
    MONDAY = 1, "Monday"
    TUESDAY = 2, "Tuesday"
    WEDNESDAY = 3, "Wednesday"
    THURSDAY = 4, "Thursday"
    FRIDAY = 5, "Friday"
    SATURDAY = 6, "Saturday"
    SUNDAY = 7, "Sunday"
