import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from django.contrib.auth import get_user_model  # noqa: E402
from apps.profiles.models import PatientProfile  # noqa: E402

User = get_user_model()
user = User.objects.get(email="patient@example.com")

if not hasattr(user, "patient_profile"):
    profile = PatientProfile.objects.create(
        user=user, managed_by=user, full_name=user.full_name, is_self=True
    )
    print("PatientProfile created!")
else:
    print("PatientProfile already exists.")
