#!/usr/bin/env python3
"""Parse every committed YAML and JSON file so a typo is caught here, not later.

A malformed workflow file or package.json silently breaks the pipeline for the
branch that owns it, which is exactly the kind of failure that wastes a week.

Exit code 0 = all parsed, 1 = at least one file is malformed.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ci_utils import error, summary  # noqa: E402

SKIP_PARTS = {"node_modules", ".venv", "venv", "dist", "build"}


def git_files(*patterns: str) -> list[str]:
    out = subprocess.run(
        ["git", "ls-files", "-z", *patterns],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    files = [p for p in out.split("\0") if p]
    return [f for f in files if not SKIP_PARTS & set(f.split("/"))]


def main() -> int:
    failures: list[str] = []
    checked = 0

    for path in git_files("*.json"):
        if path.endswith(("package-lock.json", "yarn.lock")):
            continue
        checked += 1
        try:
            with open(path, encoding="utf-8") as fh:
                json.load(fh)
        except (OSError, json.JSONDecodeError) as exc:
            error(f"Invalid JSON: {exc}", file=path)
            failures.append(f"`{path}` - {exc}")

    try:
        import yaml
    except ImportError:
        yaml = None
        summary("> PyYAML not installed - YAML syntax check skipped.\n")

    if yaml is not None:
        for path in git_files("*.yml", "*.yaml"):
            checked += 1
            try:
                with open(path, encoding="utf-8") as fh:
                    list(yaml.safe_load_all(fh))
            except (OSError, yaml.YAMLError) as exc:
                message = str(exc).replace("\n", " ")
                error(f"Invalid YAML: {message}", file=path)
                failures.append(f"`{path}` - {message}")

    lines = ["### Config syntax", "", f"Parsed **{checked}** YAML/JSON files.", ""]
    if failures:
        lines += [f"**{len(failures)} malformed file(s)**", ""] + [f"- {f}" for f in failures] + [""]
    else:
        lines += ["All parsed cleanly.", ""]
    summary("\n".join(lines))

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
