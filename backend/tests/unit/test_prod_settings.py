"""The production settings module refuses to start insecurely.

Each case imports config.settings.prod in a fresh interpreter, because the module
validates the environment as it is imported and a bad import cannot be undone
inside the test process.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[2]

GOOD = {
    "ALLOWED_HOSTS": "pillsync.example.com",
    "SECRET_KEY": "a-long-random-value-that-is-not-the-insecure-default-1234567890",
    "DATABASE_URL": "postgres://user:pw@db:5432/pillsync",  # pragma: allowlist secret
}


def load(overrides: dict[str, str | None]):
    env = {
        k: v
        for k, v in os.environ.items()
        if k
        not in {
            *GOOD,
            "USE_HTTPS",
            "POSTGRES_HOST",
            "EMAIL_HOST",
            "SENDGRID_API_KEY",
            "EMAIL_BACKEND",
        }
    }
    env.update({k: v for k, v in {**GOOD, **overrides}.items() if v is not None})
    env["DJANGO_SETTINGS_MODULE"] = "config.settings.prod"
    code = (
        "import config.settings.prod as s;"
        "print(s.SECURE_SSL_REDIRECT, s.SESSION_COOKIE_SECURE, s.SECURE_HSTS_SECONDS, s.DEBUG)"
    )
    return subprocess.run(
        [sys.executable, "-c", code], cwd=BACKEND, env=env, capture_output=True, text=True
    )


def test_a_complete_environment_starts_with_everything_locked_down():
    result = load({})
    assert result.returncode == 0, result.stderr
    assert result.stdout.split() == ["True", "True", "31536000", "False"]


@pytest.mark.parametrize(
    ("overrides", "complaint"),
    [
        ({"ALLOWED_HOSTS": ""}, "ALLOWED_HOSTS"),
        ({"SECRET_KEY": ""}, "SECRET_KEY"),
        ({"SECRET_KEY": "insecure-dev-key"}, "SECRET_KEY"),
        ({"DATABASE_URL": None}, "PostgreSQL"),
        ({"DATABASE_URL": "sqlite:///db.sqlite3"}, "PostgreSQL"),
    ],
)
def test_it_refuses_to_start_when_something_essential_is_missing(overrides, complaint):
    result = load(overrides)
    assert result.returncode != 0
    assert complaint in result.stderr


def test_https_can_be_relaxed_only_explicitly_for_local_smoke_tests():
    result = load({"USE_HTTPS": "false"})
    assert result.returncode == 0, result.stderr
    assert result.stdout.split() == ["False", "False", "0", "False"]


def email_of(overrides):
    env = {**GOOD, **overrides}
    clean = {
        k: v
        for k, v in os.environ.items()
        if k
        not in {*GOOD, "EMAIL_HOST", "SENDGRID_API_KEY", "EMAIL_BACKEND", "EMAIL_HOST_PASSWORD"}
    }
    clean.update(env)
    clean["DJANGO_SETTINGS_MODULE"] = "config.settings.prod"
    code = (
        "import warnings; warnings.simplefilter('ignore');"
        "import config.settings.prod as s;"
        "print(s.EMAIL_BACKEND.rsplit('.', 2)[-2], s.EMAIL_HOST, s.EMAIL_HOST_USER, s.EMAIL_TIMEOUT)"
    )
    return subprocess.run(
        [sys.executable, "-c", code], cwd=BACKEND, env=clean, capture_output=True, text=True
    )


def test_without_a_mail_server_email_goes_to_the_console_not_a_dead_smtp_port():
    result = email_of({})
    assert result.returncode == 0, result.stderr
    assert result.stdout.split()[0] == "console"


def test_a_sendgrid_key_alone_is_enough_to_send_real_email():
    result = email_of({"SENDGRID_API_KEY": "SG.test-key"})  # pragma: allowlist secret
    assert result.returncode == 0, result.stderr
    backend, host, user, timeout = result.stdout.split()
    assert (backend, host, user) == ("smtp", "smtp.sendgrid.net", "apikey")
    assert int(timeout) <= 30, "a hung mail server must not hang a worker"


def test_any_smtp_host_can_be_used():
    result = email_of({"EMAIL_HOST": "mail.example.com"})
    assert result.stdout.split()[:2] == ["smtp", "mail.example.com"]
