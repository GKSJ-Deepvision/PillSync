#!/usr/bin/env python3
"""Check the repository layout and report how far the branch has progressed.

Two jobs:

1. Fail if the agreed skeleton has been deleted or renamed. Twenty-six branches
   only stay reviewable if they all keep the same shape.
2. Report - without failing - which spec modules have real code and which
   milestone reports have been filled in, so the run summary doubles as a
   progress snapshot for both the intern and the mentor.

Exit code 0 = layout intact, 1 = required paths missing.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ci_utils import error, has_real_content, read_text, summary, warn  # noqa: E402

REQUIRED_DIRS = [
    "backend",
    "backend/apps",
    "backend/config",
    "backend/tests",
    "frontend",
    "frontend/src",
    "frontend/src/features",
    "ml/src",
    "docs",
    "docs/milestones",
    "deployment",
    ".github/workflows",
]

REQUIRED_FILES = [
    ".gitignore",
    "README.md",
    "INTERN_GUIDE.md",
    ".github/interns.yml",
    "backend/.env.example",
]

# Spec module -> (backend app, frontend feature, milestone it is graded in)
MODULES = [
    ("1. Authentication & RBAC", "backend/apps/accounts", "frontend/src/features/auth", 1),
    ("2. Profiles & patients", "backend/apps/profiles", "frontend/src/features/profile", 1),
    ("2. Medication management", "backend/apps/medications", "frontend/src/features/medications", 2),
    ("3. Prescriptions", "backend/apps/prescriptions", None, 2),
    ("3. OCR recognition", "backend/apps/ocr", "frontend/src/features/ocr", 3),
    ("4. Smart reminders", "backend/apps/reminders", "frontend/src/features/reminders", 2),
    ("5. Adherence tracking", "backend/apps/adherence", "frontend/src/features/adherence", 3),
    ("6. Refill prediction", "backend/apps/refills", "frontend/src/features/refills", 3),
    ("8. Notifications & alerts", "backend/apps/notifications", "frontend/src/features/notifications", 2),
    ("9. Dashboard & analytics", "backend/apps/analytics", "frontend/src/features/analytics", 4),
]

MILESTONES = {
    1: "Requirements, Database Design & Core Setup (Week 1-2)",
    2: "Medication Management & Reminder System (Week 3-4)",
    3: "OCR Recognition & Refill Prediction (Week 5-6)",
    4: "Analytics, Testing & Deployment (Week 7-8)",
}

# A report still holding these has not actually been filled in.
PLACEHOLDER_MARKERS = ("<your full name>", "<intern/NN-your-name>", "<YYYY-MM-DD>")


def tick(value: bool) -> str:
    return "yes" if value else "-"


def check_required() -> list[str]:
    problems: list[str] = []

    for rel in REQUIRED_DIRS:
        if not Path(rel).is_dir():
            msg = f"Required directory `{rel}` is missing."
            error(msg.replace("`", ""))
            problems.append(msg)

    for rel in REQUIRED_FILES:
        if not Path(rel).is_file():
            msg = f"Required file `{rel}` is missing."
            error(msg.replace("`", ""))
            problems.append(msg)

    return problems


def module_progress() -> tuple[list[str], int]:
    rows = ["| Module | Backend | Frontend | Tests | Milestone |", "|---|---|---|---|---|"]
    started = 0

    for label, backend_dir, frontend_dir, milestone in MODULES:
        backend_done = has_real_content(Path(backend_dir))
        frontend_done = has_real_content(Path(frontend_dir)) if frontend_dir else None
        tests_done = any(
            p.name.startswith("test_") or p.name.endswith("_test.py")
            for p in Path(backend_dir).rglob("*.py")
        )
        if backend_done or frontend_done:
            started += 1
        rows.append(
            f"| {label} | {tick(backend_done)} "
            f"| {'n/a' if frontend_dir is None else tick(bool(frontend_done))} "
            f"| {tick(tests_done)} | M{milestone} |"
        )

    return rows, started


def milestone_progress() -> list[str]:
    rows = ["| Milestone | Report | Status |", "|---|---|---|"]
    for number, title in MILESTONES.items():
        path = Path(f"docs/milestones/milestone-{number}.md")
        if not path.is_file():
            status = "missing"
        else:
            text = read_text(path)
            if any(marker in text for marker in PLACEHOLDER_MARKERS):
                status = "template not filled in"
            else:
                status = "submitted"
        rows.append(f"| M{number} - {title} | `{path.as_posix()}` | {status} |")
    return rows


def main() -> int:
    problems = check_required()

    module_rows, started = module_progress()

    lines = ["### Repository structure", ""]

    if problems:
        lines += [
            f"**{len(problems)} required path(s) missing.** Restore them from `main`:",
            "",
            "```bash",
            "git checkout main -- <path>",
            "```",
            "",
        ] + [f"- {p}" for p in problems] + [""]
    else:
        lines += ["Skeleton intact - all required paths present.", ""]

    lines += ["### Module progress", ""] + module_rows + [""]
    lines += [f"**{started} of {len(MODULES)}** modules have code on this branch.", ""]
    lines += ["### Milestone reports", ""] + milestone_progress() + [""]

    # Advisory nudges - these never fail the build.
    if not has_real_content(Path("backend/tests"), ignore={".gitkeep", "README.md"}) and not any(
        p.name.startswith("test_") for p in Path("backend").rglob("*.py")
    ):
        warn("No backend tests found yet. Every module needs tests before its milestone review.")
        lines += ["> No backend tests found yet - add them as you build each module.", ""]

    if not Path("frontend/package.json").is_file():
        lines += ["> `frontend/package.json` not created yet - frontend checks are skipped.", ""]

    summary("\n".join(lines))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
