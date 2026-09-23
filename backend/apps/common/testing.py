"""Helpers for tests that call the API as a signed-in Supabase user."""

import os
import time
import uuid
from unittest.mock import patch

import jwt

TEST_SECRET = "test-secret-with-at-least-32-characters-ok"


def make_token(
    sub=None, secret=TEST_SECRET, aud="authenticated", exp_in=3600, alg="HS256", **extra
):
    claims = {
        "sub": sub or str(uuid.uuid4()),
        "aud": aud,
        "exp": int(time.time()) + exp_in,
        **extra,
    }
    return jwt.encode(claims, secret, algorithm=alg)


class SupabaseAuthTestMixin:
    """Configures the JWT secret and gives tests `self.user_id` and `self.auth_header`."""

    def setUp(self):
        super().setUp()
        env = patch.dict(os.environ, {"SUPABASE_JWT_SECRET": TEST_SECRET})
        env.start()
        self.addCleanup(env.stop)
        self.user_id = str(uuid.uuid4())
        self.auth_header = {"HTTP_AUTHORIZATION": f"Bearer {make_token(self.user_id)}"}
