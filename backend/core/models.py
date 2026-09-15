from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    ROLE_CHOICES = [('patient', 'Patient'), ('caregiver', 'Caregiver'), ('admin', 'Admin')]
    STATUS_CHOICES = [('Active', 'Active'), ('Disabled', 'Disabled')]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    phone = models.CharField(max_length=40, blank=True)
    dob = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    avatar = models.URLField(blank=True)

    def __str__(self):
        return f'{self.user.email} ({self.role})'


class CaregiverPatient(models.Model):
    caregiver = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='patient_assignments')
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='caregiver_assignments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['caregiver', 'patient'], name='unique_caregiver_patient')]


class Medication(models.Model):
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='medications')
    name = models.CharField(max_length=120)
    dosage = models.CharField(max_length=80)
    frequency = models.CharField(max_length=120)
    scheduled_time = models.CharField(max_length=120)
    compliance = models.PositiveSmallIntegerField(default=0)
    quantity = models.PositiveIntegerField(default=30)
    remaining_quantity = models.PositiveIntegerField(default=30)
    active = models.BooleanField(default=True)


class Schedule(models.Model):
    STATUS_CHOICES = [('Taken', 'Taken'), ('Pending', 'Pending'), ('Missed', 'Missed'), ('Snoozed', 'Snoozed')]
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='schedule_entries')
    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name='schedule_entries')
    scheduled_for = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    snoozed_until = models.DateTimeField(null=True, blank=True)


class AdherenceRecord(models.Model):
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='adherence_records')
    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name='adherence_records', null=True, blank=True)
    scheduled_for = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Schedule.STATUS_CHOICES)
    recorded_at = models.DateTimeField(auto_now_add=True)


class Alert(models.Model):
    SEVERITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='alerts')
    type = models.CharField(max_length=80)
    medication = models.CharField(max_length=160, blank=True)
    message = models.TextField(blank=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class ActivityLog(models.Model):
    STATUS_CHOICES = [('Success', 'Success'), ('Failed', 'Failed')]
    user = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, related_name='activity_logs')
    action = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Success')
    created_at = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=120)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
