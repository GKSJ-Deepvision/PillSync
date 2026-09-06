from rest_framework.permissions import BasePermission

from apps.accounts.models import UserRole


class IsPatient(BasePermission):
    message = "Patient access required"

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.PATIENT


class IsCaregiver(BasePermission):
    message = "Caregiver access required"

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.CAREGIVER


class IsAdmin(BasePermission):
    message = "Admin access required"

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.ADMIN
