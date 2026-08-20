#!/usr/bin/env python3
"""Scan committed text files for credentials.

PillSync integrates with OpenAI, Firebase, Twilio and SendGrid, so every intern
handles real API keys during the internship. A key pushed to a shared branch is
public the moment it lands - this check exists to stop that before it happens.

Exit code 0 = clean, 1 = at least one likely secret found.
"""

from __future__ import annotations

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ci_utils import error, is_probably_binary, read_text, summary, tracked_files  # noqa: E402

# (label, compiled pattern). Patterns are deliberately specific: a false alarm
# every push teaches people to ignore the check.
PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("AWS access key id", re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b")),
    ("AWS secret access key", re.compile(r"aws_secret_access_key\s*[=:]\s*['\"][^'\"]{30,}['\"]", re.I)),
    ("OpenAI API key", re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b")),
    ("Anthropic API key", re.compile(r"\bsk-ant-[A-Za-z0-9_-]{20,}\b")),
    ("Google API key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
    ("Google service-account key", re.compile(r'"type"\s*:\s*"service_account"')),
    ("Firebase server key", re.compile(r"\bAAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140,}")),
    ("Twilio account SID", re.compile(r"\bAC[0-9a-fA-F]{32}\b")),
    ("Twilio auth token", re.compile(r"twilio_auth_token\s*[=:]\s*['\"][0-9a-f]{32}['\"]", re.I)),
    ("SendGrid API key", re.compile(r"\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b")),
    ("GitHub token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{36,}\b")),
    ("Slack token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b")),
    ("Stripe secret key", re.compile(r"\b[sr]k_live_[0-9a-zA-Z]{20,}\b")),
    ("Private key block", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----")),
    ("JSON Web Token", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
    ("Database URL with password", re.compile(r"\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?)://[^\s:'\"]+:[^\s@'\"]{4,}@")),
    (
        "Hardcoded password or secret",
        re.compile(
            r"(?i)\b(?:password|passwd|secret[_-]?key|api[_-]?key|access[_-]?token|auth[_-]?token)"
            r"\s*[=:]\s*['\"][^'\"\s{}$<>]{8,}['\"]"
        ),
    ),
]

# Lines containing any of these are placeholders, not real credentials.
PLACEHOLDER_HINTS = (
    "your-",
    "your_",
    "example",
    "changeme",
    "change-me",
    "change_me",
    "placeholder",
    "dummy",
    "xxxx",
    "<",
    "os.environ",
    "os.getenv",
    "process.env",
    "getenv(",
    "config(",
    "settings.",
    "import.meta.env",
    "${",
    "{{",
    "secrets.",
    "fake",
    "sample",
    "redacted",
    "notasecret",
    "test-key",
    "testkey",
)

# Files that are meant to contain credential-shaped text.
SKIP_PATHS = (
    ".github/scripts/scan_secrets.py",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "poetry.lock",
)

SKIP_SUFFIXES = (".min.js", ".map", ".lock", ".svg", ".ipynb")

SCAN_SUFFIXES = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".json", ".yml", ".yaml", ".toml",
    ".ini", ".cfg", ".env", ".sh", ".ps1", ".bat", ".md", ".txt", ".html",
    ".css", ".xml", ".conf", ".properties", ".tf", ".tfvars", ".example",
    "",  # extensionless files such as Dockerfile and Procfile
}

MAX_SCAN_BYTES = 2 * 1024 * 1024

# Escape hatch for the rare genuine false positive. Put it on the offending
# line and say in your commit message why the value is not a real credential:
#     TEST_TOKEN = "abcd1234abcd1234"  # pragma: allowlist secret
ALLOWLIST_PRAGMA = "pragma: allowlist secret"


def looks_like_placeholder(line: str) -> bool:
    lowered = line.lower()
    return any(hint in lowered for hint in PLACEHOLDER_HINTS)


def main() -> int:
    findings: list[tuple[str, int, str, str]] = []
    scanned = 0

    for path in tracked_files():
        posix = path.as_posix()

        if posix in SKIP_PATHS or posix.endswith(SKIP_SUFFIXES):
            continue
        if path.suffix.lower() not in SCAN_SUFFIXES:
            continue
        if not path.is_file():
            continue
        try:
            if path.stat().st_size > MAX_SCAN_BYTES:
                continue
        except OSError:
            continue
        if is_probably_binary(path):
            continue

        scanned += 1
        # .env.example files are supposed to list key names with empty values.
        is_env_example = ".env" in path.name and "example" in path.name

        for lineno, line in enumerate(read_text(path).splitlines(), start=1):
            if len(line) > 1000:
                continue
            stripped = line.strip()
            if stripped.startswith(("#", "//", "*", "<!--")):
                continue
            if ALLOWLIST_PRAGMA in line:
                continue
            if looks_like_placeholder(line):
                continue
            for label, pattern in PATTERNS:
                match = pattern.search(line)
                if not match:
                    continue
                if is_env_example and label == "Hardcoded password or secret":
                    continue
                excerpt = match.group(0)
                excerpt = excerpt[:12] + "..." if len(excerpt) > 12 else excerpt
                findings.append((posix, lineno, label, excerpt))
                break

    lines = ["### Secret scan", "", f"Scanned **{scanned}** text files.", ""]

    if findings:
        for posix, lineno, label, excerpt in findings:
            error(
                f"Possible {label} committed here. Remove it, rotate the credential, "
                "and read it from an environment variable instead.",
                file=posix,
                line=lineno,
            )
        lines += [
            f"**{len(findings)} possible credential(s) found - the branch is blocked.**",
            "",
            "| File | Line | Type | Match |",
            "|---|---|---|---|",
        ]
        lines += [f"| `{f}` | {n} | {label} | `{ex}` |" for f, n, label, ex in findings[:40]]
        if len(findings) > 40:
            lines += [f"| ...and {len(findings) - 40} more | | | |"]
        lines += [
            "",
            "**What to do now**",
            "",
            "1. Treat the credential as compromised and rotate it with the provider.",
            "2. Move the value into `backend/.env` (git-ignored) and read it via `os.environ`.",
            "3. Add the key name, with an empty value, to `.env.example`.",
            "4. Remove it from history - a plain delete commit still leaves it visible.",
            "5. If you are unsure how to rewrite history, tell your mentor rather than guessing.",
            "",
        ]
    else:
        lines += ["No credentials detected.", ""]

    summary("\n".join(lines))
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
