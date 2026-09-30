"""Start a self-contained demo of PillSync: a throwaway database, demo data, the API.

    python scripts/run_demo.py            # API on http://127.0.0.1:8010
    python scripts/run_demo.py --port 8000 --fresh

It uses its own SQLite file (demo.sqlite3, git-ignored), so it never touches the
database you develop against. On first run it migrates, loads the medicine
catalogue and seeds the demo accounts; afterwards it just starts the server.

The demo password is for local, DEBUG-only use and is printed on start. Do not
point this at a real database: seed_demo refuses to run there anyway.

Pair it with the frontend:

    API_PROXY_TARGET=http://127.0.0.1:8010 npm run dev
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
DEFAULT_PASSWORD = "demo-pillsync-2026"  # pragma: allowlist secret - local demo only


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--port", default="8010")
    parser.add_argument("--fresh", action="store_true", help="Delete the demo database first.")
    args = parser.parse_args()

    database = BACKEND / "demo.sqlite3"
    if args.fresh and database.exists():
        database.unlink()

    os.environ["DATABASE_URL"] = f"sqlite:///{database.as_posix()}"
    os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.dev"
    os.environ.setdefault("DEBUG", "true")
    os.environ.setdefault("OCR_ASYNC", "false")
    sys.path.insert(0, str(BACKEND))

    import django
    from django.core.management import call_command

    django.setup()
    call_command("migrate", verbosity=0, interactive=False)

    from apps.accounts.models import User
    from apps.common.models import MedicineReference

    if not MedicineReference.objects.exists():
        call_command("seed_reference_data")
    if not User.objects.filter(email__endswith="@pillsync.example").exists():
        call_command("seed_demo", password=os.environ.get("DEMO_PASSWORD", DEFAULT_PASSWORD))

    print(f"\nPillSync demo API on http://127.0.0.1:{args.port}  (database: {database.name})\n")
    call_command("runserver", f"127.0.0.1:{args.port}", use_reloader=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
