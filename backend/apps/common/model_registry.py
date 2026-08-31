"""Imports every app's `models.py` so they all register on `Base.metadata`.

SQLAlchemy's declarative mapper needs every mapped class imported at least
once before it resolves string-based relationships (e.g. `Reminder`'s
`Mapped["Medicine"]`) or before Alembic compares metadata against the live
database. `config/database.py`'s callers and `alembic/env.py` both import
this module for that side effect — nothing here is meant to be used directly.
"""

from __future__ import annotations

from apps.accounts import models as accounts_models  # noqa: F401
from apps.adherence import models as adherence_models  # noqa: F401
from apps.common.models import Base  # noqa: F401
from apps.medications import models as medications_models  # noqa: F401
from apps.profiles import models as profiles_models  # noqa: F401
from apps.refills import models as refills_models  # noqa: F401
from apps.reminders import models as reminders_models  # noqa: F401
