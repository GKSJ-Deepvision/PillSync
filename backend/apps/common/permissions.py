"""Role-based access control.

The specification gives three roles with sharply different reach:

* a **patient** sees only their own records and those of family profiles they manage;
* a **caregiver** sees the patients who have an ACTIVE assignment to them, and
  only the parts of those records the assignment grants;
* an **admin** administers the platform.

These classes are the single place that policy is expressed. Views declare which
one they need instead of re-deriving the rules, so a mistake in one endpoint
cannot quietly widen access in another.
"""

from __future__ import annotations

from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.common.choices import UserRole


class IsAdmin(BasePermission):
    message = "Only platform administrators can perform this action."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.is_admin)


class IsPatient(BasePermission):
    message = "Only patients can perform this action."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.role == UserRole.PATIENT)


class IsCaregiver(BasePermission):
    message = "Only caregivers can perform this action."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.role == UserRole.CAREGIVER)


class IsPatientOrCaregiver(BasePermission):
    message = "Only patients and caregivers can perform this action."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(
            user and user.is_authenticated and user.role in {UserRole.PATIENT, UserRole.CAREGIVER}
        )


class IsSelfOrAdmin(BasePermission):
    """Object-level: the user themselves, or an administrator."""

    message = "You can only access your own account."

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_admin:
            return True
        return obj == user or getattr(obj, "user_id", None) == user.id


class IsProfileOwnerOrAssignedCaregiver(BasePermission):
    """Object-level access to a patient profile and anything hanging off it.

    Write access stays with the patient (or the family member who manages the
    profile) and admins. A caregiver gets read access only while their
    assignment is ACTIVE - which is why this asks the object, rather than
    trusting a role string on the request.
    """

    message = "You do not have access to this patient profile."

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_admin:
            return True

        profile = self._resolve_profile(obj)
        if profile is None:
            return False

        if profile.user_id == user.id or profile.managed_by_id == user.id:
            return True

        if request.method in SAFE_METHODS:
            return profile.is_visible_to_caregiver(user)

        return False

    @staticmethod
    def _resolve_profile(obj):
        """Accept either a PatientProfile or anything with a `patient` FK."""
        if hasattr(obj, "is_visible_to_caregiver"):
            return obj
        return getattr(obj, "patient", None)


class ReadOnly(BasePermission):
    """Allow safe methods only - used to make reference data read-only."""

    def has_permission(self, request, view) -> bool:
        return request.method in SAFE_METHODS
