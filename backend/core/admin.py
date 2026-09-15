from django.contrib import admin

from .models import ActivityLog, Alert, AdherenceRecord, CaregiverPatient, Medication, Notification, Profile, Schedule

admin.site.register([Profile, CaregiverPatient, Medication, Schedule, AdherenceRecord, Alert, ActivityLog, Notification])
