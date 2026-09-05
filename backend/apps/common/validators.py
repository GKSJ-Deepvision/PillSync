"""Field validators shared across apps."""

from __future__ import annotations

import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

# Deliberately permissive: patients and caregivers are international, and a
# rejected valid number is worse than a stored odd one. It only rules out input
# that cannot be a phone number at all.
PHONE_RE = re.compile(r"^\+?[0-9][0-9\s\-().]{5,19}$")


def validate_phone_number(value: str) -> None:
    if value and not PHONE_RE.match(value):
        raise ValidationError(
            _("Enter a valid phone number, for example +91 98765 43210."),
            code="invalid_phone",
        )


def validate_not_future(value) -> None:
    """A date of birth or a diagnosis date cannot be in the future."""
    from django.utils import timezone

    if value and value > timezone.localdate():
        raise ValidationError(_("This date cannot be in the future."), code="future_date")
