from rest_framework import permissions

from apps.accounts.models import User


class IsPatient(permissions.BasePermission):
    """Allows access only to authenticated users with Patient role."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.PATIENT
        )


class IsCaregiver(permissions.BasePermission):
    """Allows access only to authenticated users with Caregiver role."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.CAREGIVER
        )


class IsAdminUserRole(permissions.BasePermission):
    """Allows access only to authenticated users with Admin role or staff."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.role == User.Role.ADMIN
                or request.user.is_staff
                or request.user.is_superuser
            )
        )


class IsOwnerOrCaregiver(permissions.BasePermission):
    """
    Object-level permission allowing access if the object belongs to the user,
    an assigned caregiver, or an admin.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser or request.user.role == User.Role.ADMIN:
            return True

        # Check direct ownership on profile or user attribute
        if hasattr(obj, "user") and obj.user == request.user:
            return True

        if hasattr(obj, "caregiver") and obj.caregiver == request.user:
            return True

        # Check indirect patient profile link
        if hasattr(obj, "patient_profile") and obj.patient_profile:
            return (
                obj.patient_profile.user == request.user
                or getattr(obj.patient_profile, "caregiver", None) == request.user
            )

        return False


class HasPatientProfileAccess(permissions.BasePermission):
    """
    Permission check based on User.accessible_patient_profiles().
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        accessible_profiles = request.user.accessible_patient_profiles()

        # If obj is itself a PatientProfile
        if obj.__class__.__name__ == "PatientProfile":
            return accessible_profiles.filter(pk=obj.pk).exists()

        # If obj references a patient_profile
        if hasattr(obj, "patient_profile") and obj.patient_profile:
            return accessible_profiles.filter(pk=obj.patient_profile.pk).exists()

        return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow administrators to edit or delete data,
    while allowing read-only access for others.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == User.Role.ADMIN or request.user.is_staff)
        )
