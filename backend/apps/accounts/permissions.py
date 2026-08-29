from fastapi import Depends, HTTPException, status

from apps.accounts.dependencies import get_current_user
from apps.accounts.models import User, UserRole


def require_patient(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient access required",
        )
    return current_user


def require_caregiver(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.CAREGIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Caregiver access required",
        )
    return current_user


def require_admin(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
