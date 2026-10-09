from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CaregiverPatientRelationship, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("PillSync", {"fields": ("role",)}),)

    add_fieldsets = UserAdmin.add_fieldsets + (("PillSync", {"fields": ("email", "role")}),)

    list_display = ("username", "email", "role", "is_staff", "is_active")


@admin.register(CaregiverPatientRelationship)
class CaregiverPatientRelationshipAdmin(admin.ModelAdmin):
    list_display = ("caregiver", "patient", "created_at")
    list_select_related = ("caregiver", "patient")
    search_fields = ("caregiver__username", "patient__username")
