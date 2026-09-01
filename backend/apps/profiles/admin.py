from django.contrib import admin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "phone_number",
        "date_of_birth",
        "emergency_contact_name",
        "emergency_contact_phone",
    )
