#!/usr/bin/env python3
"""Hygiene checks over every file on the branch.

Catches the things that quietly ruin a shared teaching repo: committed
dependency folders, build output, databases, oversized binaries and files that
break on a teammate's operating system.

Exit code 0 = clean, 1 = at least one error.
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ci_utils import error, summary, tracked_files, warn  # noqa: E402

MAX_FILE_BYTES = 20 * 1024 * 1024  # hard fail above this
WARN_FILE_BYTES = 5 * 1024 * 1024  # nudge above this

# Directory names that must never be committed.
FORBIDDEN_DIRS = {
    "node_modules": "installed npm packages - run `npm install` instead",
    ".venv": "a Python virtual environment - list packages in requirements/ instead",
    "venv": "a Python virtual environment - list packages in requirements/ instead",
    "__pycache__": "Python bytecode cache",
    ".pytest_cache": "pytest cache",
    ".ruff_cache": "ruff cache",
    ".mypy_cache": "mypy cache",
    "htmlcov": "a generated coverage report",
    "staticfiles": "collected static files - generated at deploy time",
    ".idea": "IDE settings",
}

# Build output. Only flagged directly under an app root, so a legitimate
# src/components/build/ folder is not caught by mistake.
BUILD_DIRS = {"dist", "build", ".next", ".vite", "coverage"}

FORBIDDEN_SUFFIXES = {
    ".pyc": "compiled Python",
    ".pyo": "compiled Python",
    ".sqlite3": "a local database - never commit application data",
    ".db": "a local database - never commit application data",
    ".log": "a log file",
    ".pem": "a private key",
    ".key": "a private key",
    ".p12": "a certificate bundle",
    ".pfx": "a certificate bundle",
}

# Exact filenames that must never be committed.
FORBIDDEN_NAMES = {
    ".env": "your real environment file - commit .env.example instead",
    ".env.local": "a real environment file",
    ".env.production": "a real environment file",
    "credentials.json": "service credentials",
    "secrets.json": "secrets",
    "serviceAccountKey.json": "a Firebase service account key",
    "db.sqlite3": "a local database",
}

WINDOWS_RESERVED = {
    "con",
    "prn",
    "aux",
    "nul",
    *(f"com{i}" for i in range(1, 10)),
    *(f"lpt{i}" for i in range(1, 10)),
}

INVALID_NAME_CHARS = set(':*?"<>|')

# Places where a genuinely large file is expected and allowed.
ALLOWED_LARGE_PREFIXES = ("docs/", "ml/data/samples/")


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    def fail(message: str, path: str) -> None:
        error(message.replace("`", ""), file=path)
        errors.append(message)

    def caution(message: str, path: str) -> None:
        warn(message.replace("`", ""), file=path)
        warnings.append(message)

    files = tracked_files()
    seen_lower: dict[str, str] = {}

    for path in files:
        posix = path.as_posix()
        parts = set(path.parts)

        for bad, why in FORBIDDEN_DIRS.items():
            if bad in parts:
                fail(f"`{posix}` is inside `{bad}/`, which is {why}.", posix)
                break

        if len(path.parts) > 2 and path.parts[0] in {"frontend", "backend", "ml"}:
            if path.parts[1] in BUILD_DIRS:
                fail(
                    f"`{posix}` is build output (`{path.parts[0]}/{path.parts[1]}/`) "
                    "and should not be committed.",
                    posix,
                )

        if path.suffix.lower() in FORBIDDEN_SUFFIXES:
            fail(f"`{posix}` is {FORBIDDEN_SUFFIXES[path.suffix.lower()]}.", posix)

        if path.name in FORBIDDEN_NAMES:
            fail(f"`{posix}` is {FORBIDDEN_NAMES[path.name]}.", posix)

        try:
            size = path.stat().st_size
        except OSError:
            size = 0

        if size > MAX_FILE_BYTES and not posix.startswith(ALLOWED_LARGE_PREFIXES):
            limit = MAX_FILE_BYTES // 1024 // 1024
            fail(
                f"`{posix}` is {size / 1024 / 1024:.1f} MB - over the {limit} MB limit.",
                posix,
            )
        elif size > WARN_FILE_BYTES:
            caution(
                f"`{posix}` is {size / 1024 / 1024:.1f} MB - large for source control.",
                posix,
            )

        if " " in path.name:
            caution(f"`{posix}` has a space in its filename - use dashes or underscores.", posix)

        if INVALID_NAME_CHARS & set(path.name):
            fail(f"`{posix}` contains a character that is invalid on Windows.", posix)

        if path.stem.lower() in WINDOWS_RESERVED:
            fail(f"`{posix}` uses a name reserved by Windows.", posix)

        # Case-only collisions break checkouts on Windows and macOS.
        lower = posix.lower()
        if lower in seen_lower and seen_lower[lower] != posix:
            fail(f"`{posix}` and `{seen_lower[lower]}` differ only by letter case.", posix)
        seen_lower[lower] = posix

    lines = ["### File hygiene", "", f"Scanned **{len(files)}** tracked files.", ""]
    if errors:
        lines += [f"**{len(errors)} error(s)**", ""] + [f"- {e}" for e in errors[:40]] + [""]
        if len(errors) > 40:
            lines += [f"- ...and {len(errors) - 40} more", ""]
    if warnings:
        lines += [f"**{len(warnings)} warning(s)**", ""] + [f"- {w}" for w in warnings[:20]] + [""]
        if len(warnings) > 20:
            lines += [f"- ...and {len(warnings) - 20} more", ""]
    if not errors and not warnings:
        lines += ["No problems found.", ""]
    summary("\n".join(lines))

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
