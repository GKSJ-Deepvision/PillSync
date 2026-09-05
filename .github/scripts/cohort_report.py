#!/usr/bin/env python3
"""Build a mentor-facing progress table across all 26 intern branches.

Nothing is merged into main, so there is no single place to see how the cohort
is doing. This walks the roster, asks the GitHub API about each intern's branch,
and writes one table into the workflow run summary.

Needs GITHUB_TOKEN, GITHUB_REPOSITORY and GITHUB_API_URL in the environment -
GitHub Actions provides all three.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import UTC, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import roster  # noqa: E402
from ci_utils import summary, warn  # noqa: E402

API = os.environ.get("GITHUB_API_URL", "https://api.github.com")
REPO = os.environ.get("GITHUB_REPOSITORY", "")
TOKEN = os.environ.get("GITHUB_TOKEN", "")


def api_get(path: str, params: dict[str, str] | None = None):
    url = f"{API}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url)
    request.add_header("Accept", "application/vnd.github+json")
    request.add_header("X-GitHub-Api-Version", "2022-11-28")
    if TOKEN:
        request.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None
        warn(f"GitHub API {exc.code} for {path}")
        return None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        warn(f"GitHub API call failed for {path}: {exc}")
        return None


def days_since(iso: str | None) -> str:
    if not iso:
        return "-"
    try:
        when = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return "-"
    delta = datetime.now(UTC) - when
    if delta.days == 0:
        return "today"
    if delta.days == 1:
        return "1 day ago"
    return f"{delta.days} days ago"


def branch_status(branch: str) -> dict[str, str]:
    encoded = urllib.parse.quote(branch, safe="")
    info = api_get(f"/repos/{REPO}/branches/{encoded}")
    if info is None:
        return {"exists": "no", "last_commit": "-", "author": "-", "commits": "-", "ci": "-"}

    commit = info.get("commit", {}).get("commit", {})
    author = commit.get("author", {}) or {}
    last_date = author.get("date")

    # Commit count ahead of main, which is what the intern has actually added.
    comparison = api_get(f"/repos/{REPO}/compare/main...{encoded}")
    ahead = str(comparison.get("ahead_by", "-")) if comparison else "-"

    runs = api_get(
        f"/repos/{REPO}/actions/runs",
        {"branch": branch, "per_page": "1", "event": "push"},
    )
    ci = "-"
    if runs and runs.get("workflow_runs"):
        run = runs["workflow_runs"][0]
        ci = run.get("conclusion") or run.get("status") or "-"

    return {
        "exists": "yes",
        "last_commit": days_since(last_date),
        "author": (author.get("name") or "-")[:28],
        "commits": ahead,
        "ci": ci,
    }


def main() -> int:
    if not REPO:
        warn("GITHUB_REPOSITORY is not set - cannot query the API.")
        return 0

    data = roster.load()
    rows = [
        "| # | Intern | Branch | Pushed | Commits | Last CI | Last activity |",
        "|---|---|---|---|---|---|---|",
    ]

    not_started: list[str] = []
    failing: list[str] = []
    stale: list[str] = []

    for intern in data.interns:
        status = branch_status(intern.branch)
        if status["exists"] == "no":
            not_started.append(intern.name)
        if status["ci"] == "failure":
            failing.append(intern.name)
        if "days ago" in status["last_commit"]:
            try:
                if int(status["last_commit"].split()[0]) >= 7:
                    stale.append(intern.name)
            except ValueError:
                pass

        rows.append(
            f"| {intern.id} | {intern.name} | `{intern.branch}` | {status['exists']} "
            f"| {status['commits']} | {status['ci']} | {status['last_commit']} |"
        )

    lines = [
        f"## PillSync cohort report - {len(data.interns)} interns",
        "",
        *rows,
        "",
        "### Needs attention",
        "",
        f"- **Branch not created yet ({len(not_started)}):** "
        + (", ".join(not_started) if not_started else "none"),
        f"- **Last CI run failing ({len(failing)}):** " + (", ".join(failing) if failing else "none"),
        f"- **No push in 7+ days ({len(stale)}):** " + (", ".join(stale) if stale else "none"),
        "",
    ]
    summary("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
