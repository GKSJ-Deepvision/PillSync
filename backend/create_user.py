import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from django.contrib.auth import get_user_model  # noqa: E402

User = get_user_model()

email = "patient@example.com"
if not User.objects.filter(email=email).exists():
    user = User.objects.create_user(
        email=email, password="testpassword", full_name="Patient Demo", role="PATIENT"
    )
    print("User created!")
else:
    print("User already exists.")
