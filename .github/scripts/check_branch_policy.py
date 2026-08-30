#!/usr/bin/env python3
"""Verify the pushed branch belongs to a known intern.

Every intern works on their own branch and nothing is merged into main, so the
branch name is the only thing tying a submission to a person. A branch that is
not in the roster means work would be graded against nobody.

Exit code 0 = allowed, 1 = rejected.
"""

from __future__ import annotations

import difflib
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import roster  # noqa: E402
from ci_utils import error, notice, summary  # noqa: E402

# Branches mentors and maintainers may use alongside the intern branches.
MENTOR_PREFIXES = ("mentor/", "ci/", "docs/", "hotfix/", "release/")


def main() -> int:
    branch = os.environ.get("BRANCH_NAME") or os.environ.get("GITHUB_REF_NAME", "")
    if not branch:
        error("Could not determine the branch name.")
        return 1

    data = roster.load()

    if branch == data.protected_branch:
        summary(f"### Branch policy\n\n`{branch}` is the protected mentor branch - allowed.\n")
        return 0

    if branch.startswith(MENTOR_PREFIXES):
        summary(f"### Branch policy\n\n`{branch}` is a maintainer branch - allowed.\n")
        return 0

    intern = data.by_branch(branch)
    if intern:
        summary(
            "### Branch policy\n\n"
            "| Branch | Intern | ID |\n|---|---|---|\n"
            f"| `{branch}` | {intern.name} | {intern.id} |\n"
        )
        notice(f"Branch recognised: {intern.name} (#{intern.id})")
        return 0

    known = [i.branch for i in data.interns]
    suggestions = difflib.get_close_matches(branch, known, n=3, cutoff=0.5)

    error(
        f"Branch '{branch}' is not in the intern roster (.github/interns.yml). "
        f"Intern branches must be named exactly '{data.branch_prefix}NN-firstname-lastname'."
    )
    lines = [
        "### Branch policy - rejected",
        "",
        f"`{branch}` is not a recognised branch name.",
        "",
        "Rename it to the exact name listed for you in `.github/interns.yml`:",
        "",
        "```bash",
        "git branch -m <your-correct-branch-name>",
        "git push origin -u <your-correct-branch-name>",
        f"git push origin --delete {branch}",
        "```",
        "",
    ]
    if suggestions:
        lines += ["Did you mean:", ""] + [f"- `{s}`" for s in suggestions] + [""]
    summary("\n".join(lines))
    return 1


if __name__ == "__main__":
    sys.exit(main())
