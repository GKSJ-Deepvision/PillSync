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
