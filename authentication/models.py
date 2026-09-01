from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('patient', 'Patient'),
        ('caregiver', 'Caregiver'),
        ('admin', 'Admin'),
    )

    email = models.EmailField(unique=True, help_text="User's unique email address")
    phone_number = models.CharField(max_length=20, blank=True, null=True, help_text="Contact phone number")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient', help_text="User role identifier")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp when user was created")
    updated_at = models.DateTimeField(auto_now=True, help_text="Timestamp when user was last updated")

    class Meta:
        db_table = 'auth_users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.username} ({self.email})"
