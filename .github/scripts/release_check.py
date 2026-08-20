#!/usr/bin/env python3
"""Milestone 4 readiness checklist.

Run by the CD workflow before it builds anything. It answers one question: is
this branch actually a finished project, or a work in progress that would fall
over the moment it is deployed?

Hard failures are things that make a deployment unsafe or impossible.
Everything else is reported as a warning so you can still do a dry run.

Exit code 0 = ready enough to build, 1 = blocking gap.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ci_utils import error, has_real_content, read_text, summary, warn  # noqa: E402

PLACEHOLDER_MARKERS = ("<your full name>", "<intern/NN-your-name>", "<YYYY-MM-DD>")

# (label, path, blocking?)
REQUIRED = [
    ("Backend Dockerfile", "backend/Dockerfile", True),
    ("Frontend Dockerfile", "frontend/Dockerfile", True),
    ("Backend environment template", "backend/.env.example", True),
    ("Compose stack", "docker-compose.yml", False),
    ("Milestone 4 report", "docs/milestones/milestone-4.md", False),
    ("Architecture notes", "docs/architecture", False),
    ("Database notes", "docs/database", False),
    ("API notes", "docs/api", False),
    ("Demo material", "docs/demo", False),
]


def present(rel: str) -> bool:
    path = Path(rel)
    if path.is_dir():
        return has_real_content(path)
    return path.is_file()


def main() -> int:
    blocking: list[str] = []
    advisory: list[str] = []
    rows = ["| Item | Status |", "|---|---|"]

    for label, rel, is_blocking in REQUIRED:
        ok = present(rel)
        rows.append(f"| {label} (`{rel}`) | {'present' if ok else 'MISSING'} |")
        if ok:
            continue
        message = f"{label} is missing: `{rel}`"
        if is_blocking:
            error(message.replace("`", ""), file=rel)
            blocking.append(message)
        else:
            warn(message.replace("`", ""), file=rel)
            advisory.append(message)

    # Tests must exist before anything ships.
    has_backend_tests = any(
        p.name.startswith("test_") or p.name.endswith("_test.py")
        for p in Path("backend").rglob("*.py")
    )
    rows.append(f"| Backend tests | {'present' if has_backend_tests else 'MISSING'} |")
    if not has_backend_tests:
        message = "No backend tests found. A release with no tests cannot be signed off."
        error(message)
        blocking.append(message)

    # The milestone report has to be filled in, not just present.
    report = Path("docs/milestones/milestone-4.md")
    if report.is_file():
        text = read_text(report)
        if any(marker in text for marker in PLACEHOLDER_MARKERS):
            message = "`docs/milestones/milestone-4.md` still contains template placeholders."
            warn(message.replace("`", ""), file=report.as_posix())
            advisory.append(message)

    lines = ["### Milestone 4 readiness", "", *rows, ""]
    if blocking:
        lines += [f"**{len(blocking)} blocking gap(s)**", ""] + [f"- {b}" for b in blocking] + [""]
    if advisory:
        lines += [f"**{len(advisory)} thing(s) to finish**", ""] + [f"- {a}" for a in advisory] + [""]
    if not blocking and not advisory:
        lines += ["Everything on the checklist is in place.", ""]
    summary("\n".join(lines))

    return 1 if blocking else 0


if __name__ == "__main__":
    sys.exit(main())
