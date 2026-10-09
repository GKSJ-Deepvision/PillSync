#!/usr/bin/env python3
"""Report which of the expected npm scripts the branch has defined.

CI runs the frontend checks with `--if-present`, so a missing script silently
skips its check. This makes that visible instead.
"""

from __future__ import annotations

import json
import os
import pathlib
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ci_utils import summary, warn  # noqa: E402

EXPECTED = {
    "lint": "eslint .",
    "format:check": "prettier --check .",
    "test": "vitest --run  (or jest)",
    "build": "vite build  (or react-scripts build)",
}


def main() -> int:
    package = pathlib.Path("package.json")
    if not package.is_file():
        summary("### Frontend scripts\n\nNo `package.json` found.\n")
        return 0

    try:
        scripts = json.loads(package.read_text(encoding="utf-8")).get("scripts", {})
    except json.JSONDecodeError as exc:
        warn(f"frontend/package.json is not valid JSON: {exc}")
        return 0

    rows = ["### Frontend scripts", "", "| Script | Status | Suggested command |", "|---|---|---|"]
    missing = []
    for name, suggestion in EXPECTED.items():
        if name in scripts:
            rows.append(f"| `{name}` | defined | `{scripts[name]}` |")
        else:
            missing.append(name)
            rows.append(f"| `{name}` | **not defined - check skipped** | `{suggestion}` |")
    rows.append("")

    if missing:
        warn(
            "frontend/package.json is missing these scripts, so CI skipped those checks: "
            + ", ".join(missing)
        )

    summary("\n".join(rows))
    return 0


if __name__ == "__main__":
    sys.exit(main())
