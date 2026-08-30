#!/usr/bin/env python3
"""Warn about notebooks committed with their outputs still stored.

Stored outputs bloat the repository and, for this project, can embed images of
prescriptions straight into git history. Clear all outputs before committing.

Exit code 0 = fine (or warnings only), 1 = a notebook is not valid JSON.
"""

from __future__ import annotations

import json
import os
import pathlib
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ci_utils import error, summary, warn  # noqa: E402

SKIP_PARTS = {".ipynb_checkpoints", "node_modules", ".venv", "venv"}


def main() -> int:
    broken: list[str] = []
    dirty: list[str] = []
    checked = 0

    for nb in pathlib.Path(".").rglob("*.ipynb"):
        if SKIP_PARTS & set(nb.parts):
            continue
        posix = nb.as_posix()
        checked += 1
        try:
            data = json.loads(nb.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            error(f"Notebook is not valid JSON: {exc}", file=posix)
            broken.append(posix)
            continue

        for cell in data.get("cells", []):
            if cell.get("outputs") or cell.get("execution_count"):
                warn(
                    "Notebook still has stored outputs. Use 'Clear All Outputs' before "
                    "committing - outputs bloat the repo and can leak data.",
                    file=posix,
                )
                dirty.append(posix)
                break

    lines = ["### Notebooks", "", f"Checked **{checked}** notebooks.", ""]
    if broken:
        lines += ["**Unreadable:**", ""] + [f"- `{p}`" for p in broken] + [""]
    if dirty:
        lines += ["**Committed with outputs (clear them):**", ""] + [f"- `{p}`" for p in dirty] + [""]
    if not broken and not dirty:
        lines += ["Nothing to flag.", ""]
    summary("\n".join(lines))

    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
