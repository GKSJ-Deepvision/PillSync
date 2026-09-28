from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Notification(models.Model):
    CATEGORY_CHOICES = (
        ("reminder", "Dose Reminder"),
        ("refill", "Refill Recommendation"),
        ("low_stock", "Low-Stock Alert"),
        ("missed", "Missed Dose Warning"),
        ("caregiver", "Caregiver Notification"),
    )

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="reminder")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.category}] {self.title}"
