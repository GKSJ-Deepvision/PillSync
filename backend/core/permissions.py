from rest_framework.permissions import BasePermission


class HasRole(BasePermission):
    allowed_roles = ()

    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.status == 'Active'
            and request.user.profile.role in self.allowed_roles
        )


class IsCaregiver(HasRole):
    allowed_roles = ('caregiver',)


class IsAdmin(HasRole):
    allowed_roles = ('admin',)


class IsPatient(HasRole):
    allowed_roles = ('patient',)
