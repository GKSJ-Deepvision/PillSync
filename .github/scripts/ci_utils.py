"""Small helpers shared by the PillSync CI check scripts.

Everything here is standard library only — the checks must run on a bare runner
before any project dependency has been installed.
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

SUMMARY_PATH = os.environ.get("GITHUB_STEP_SUMMARY")
IN_ACTIONS = os.environ.get("GITHUB_ACTIONS") == "true"


def annotate(level: str, message: str, file: str | None = None, line: int | None = None) -> None:
    """Emit a GitHub Actions annotation, or a readable line when run locally."""
    message = message.replace("\n", " ")
    if IN_ACTIONS:
        parts = []
        if file:
            parts.append(f"file={file}")
        if line:
            parts.append(f"line={line}")
        location = ",".join(parts)
        print(f"::{level} {location}::{message}" if location else f"::{level}::{message}")
    else:
        where = f" [{file}{':' + str(line) if line else ''}]" if file else ""
        print(f"{level.upper()}:{where} {message}")


def error(message: str, file: str | None = None, line: int | None = None) -> None:
    annotate("error", message, file, line)


def warn(message: str, file: str | None = None, line: int | None = None) -> None:
    annotate("warning", message, file, line)


def notice(message: str, file: str | None = None, line: int | None = None) -> None:
    annotate("notice", message, file, line)


def summary(markdown: str) -> None:
    """Append markdown to the GitHub Actions job summary (and stdout locally)."""
    if SUMMARY_PATH:
        with open(SUMMARY_PATH, "a", encoding="utf-8") as fh:
            fh.write(markdown.rstrip() + "\n")
    else:
        print(markdown)


def tracked_files() -> list[Path]:
    """Every file git tracks on the current checkout."""
    out = subprocess.run(
        ["git", "ls-files", "-z"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return [Path(p) for p in out.split("\0") if p]


def changed_files(base_ref: str | None = None) -> list[Path]:
    """Files changed against a base ref, falling back to the whole tree."""
    if base_ref:
        result = subprocess.run(
            ["git", "diff", "--name-only", "--diff-filter=ACMR", f"{base_ref}...HEAD"],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0 and result.stdout.strip():
            return [Path(p) for p in result.stdout.splitlines() if p]
    return tracked_files()


def is_probably_binary(path: Path) -> bool:
    try:
        with open(path, "rb") as fh:
            return b"\0" in fh.read(4096)
    except OSError:
        return True


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def has_real_content(directory: Path, ignore: set[str] | None = None) -> bool:
    """True when a directory holds something other than placeholders."""
    ignore = ignore or {".gitkeep", "README.md", ".gitignore"}
    if not directory.is_dir():
        return False
    for item in directory.rglob("*"):
        if item.is_file() and item.name not in ignore:
            return True
    return False
