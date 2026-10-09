"""Shared roster parsing for the PillSync CI checks.

Reads .github/interns.yml without needing PyYAML installed on the runner.
The roster file uses a deliberately simple one-line-per-intern format so this
regex parser stays reliable.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

ROSTER_PATH = Path(".github/interns.yml")

_ENTRY = re.compile(
    r'-\s*\{\s*id:\s*"(?P<id>[^"]+)"\s*,'
    r'\s*name:\s*"(?P<name>[^"]+)"\s*,'
    r'\s*branch:\s*"(?P<branch>[^"]+)"\s*\}'
)
_SCALAR = re.compile(r'^(?P<key>[a-z_]+):\s*"(?P<value>[^"]*)"\s*$', re.MULTILINE)


@dataclass(frozen=True)
class Intern:
    id: str
    name: str
    branch: str


@dataclass(frozen=True)
class Roster:
    project: str
    domain: str
    protected_branch: str
    branch_prefix: str
    interns: list[Intern]

    def by_branch(self, branch: str) -> Intern | None:
        for intern in self.interns:
            if intern.branch == branch:
                return intern
        return None


def load(path: Path = ROSTER_PATH) -> Roster:
    if not path.exists():
        raise FileNotFoundError(f"roster file not found: {path}")

    text = path.read_text(encoding="utf-8")
    scalars = {m.group("key"): m.group("value") for m in _SCALAR.finditer(text)}
    interns = [
        Intern(id=m.group("id"), name=m.group("name"), branch=m.group("branch"))
        for m in _ENTRY.finditer(text)
    ]

    if not interns:
        raise ValueError(f"no intern entries parsed from {path} — check the file format")

    return Roster(
        project=scalars.get("project", "PillSync"),
        domain=scalars.get("domain", "AI"),
        protected_branch=scalars.get("protected_branch", "main"),
        branch_prefix=scalars.get("branch_prefix", "intern/"),
        interns=interns,
    )
