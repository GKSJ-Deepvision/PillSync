from fastapi import Depends, HTTPException, status

from app.api.auth import get_current_user
from app.models.user import User


VALID_ROLES = {"patient", "caregiver", "admin"}


def require_roles(*allowed_roles: str):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )
        return current_user

    return role_checker


patient_only = require_roles("patient")
caregiver_only = require_roles("caregiver")
admin_only = require_roles("admin")

patient_or_caregiver = require_roles("patient", "caregiver")
caregiver_or_admin = require_roles("caregiver", "admin")