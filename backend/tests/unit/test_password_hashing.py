"""Passwords are hashed with the algorithm production is configured to use.

Development and the test suite run with a fast MD5 hasher (see config/settings/dev.py),
so a missing dependency of the real hasher is invisible everywhere except in a
deployed container - where it turns every registration and login into a 500. This
test exercises the production hasher list directly so that cannot happen again.
"""

from __future__ import annotations

from django.contrib.auth.hashers import check_password, make_password
from django.test import override_settings

from config.settings import base


def test_the_production_hasher_is_argon2_and_it_works():
    with override_settings(PASSWORD_HASHERS=base.PASSWORD_HASHERS):
        encoded = make_password("correct-horse-battery-42")  # pragma: allowlist secret

        assert encoded.startswith("argon2$")
        assert check_password("correct-horse-battery-42", encoded)  # pragma: allowlist secret
        assert not check_password("wrong", encoded)


def test_an_older_pbkdf2_hash_still_verifies_after_the_switch():
    with override_settings(PASSWORD_HASHERS=base.PASSWORD_HASHERS):
        legacy = make_password("some-password-1", hasher="pbkdf2_sha256")
        assert legacy.startswith("pbkdf2_sha256$")
        assert check_password("some-password-1", legacy)
