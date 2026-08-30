#!/usr/bin/env python3
"""Print backend line coverage into the GitHub Actions job summary."""

from __future__ import annotations

import os
import sys
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ci_utils import summary, warn  # noqa: E402

TARGET_PERCENT = 60.0


def main() -> int:
    path = sys.argv[1] if len(sys.argv) > 1 else "coverage.xml"
    try:
        root = ET.parse(path).getroot()
    except (OSError, ET.ParseError) as exc:
        warn(f"Could not read coverage report {path}: {exc}")
        return 0

    line_rate = float(root.get("line-rate") or 0.0) * 100
    branch_rate = float(root.get("branch-rate") or 0.0) * 100

    summary(
        "### Backend coverage\n\n"
        "| Metric | Value |\n|---|---|\n"
        f"| Line coverage | {line_rate:.1f}% |\n"
        f"| Branch coverage | {branch_rate:.1f}% |\n"
    )

    if line_rate < TARGET_PERCENT:
        warn(
            f"Line coverage is {line_rate:.1f}%, below the {TARGET_PERCENT:.0f}% target. "
            "This does not fail the build, but low coverage counts against the milestone review."
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
