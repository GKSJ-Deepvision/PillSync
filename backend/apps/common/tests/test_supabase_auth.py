import os
import uuid
from unittest.mock import MagicMock, patch

from cryptography.hazmat.primitives.asymmetric import rsa
from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.testing import TEST_SECRET, SupabaseAuthTestMixin, make_token

URL = "/api/refills/check/"  # any protected endpoint
BODY = {"medication_id": str(uuid.uuid4()), "quantity_on_hand": 60, "daily_consumption": 2}


class SupabaseAuthTests(SupabaseAuthTestMixin, TestCase):
    def post(self, **headers):
        return APIClient().post(URL, BODY, format="json", **headers)

    def test_no_token_is_401(self):
        self.assertEqual(self.post().status_code, 401)

    def test_valid_token_is_accepted(self):
        self.assertEqual(self.post(**self.auth_header).status_code, 201)

    def test_expired_token_is_401(self):
        token = make_token(exp_in=-10)
        self.assertEqual(self.post(HTTP_AUTHORIZATION=f"Bearer {token}").status_code, 401)

    def test_wrong_secret_is_401(self):
        token = make_token(secret="another-secret-that-is-long-enough-12345")
        self.assertEqual(self.post(HTTP_AUTHORIZATION=f"Bearer {token}").status_code, 401)

    def test_wrong_audience_is_401(self):
        token = make_token(aud="anon")
        self.assertEqual(self.post(HTTP_AUTHORIZATION=f"Bearer {token}").status_code, 401)

    def test_garbage_and_alg_none_tokens_are_401(self):
        self.assertEqual(self.post(HTTP_AUTHORIZATION="Bearer not-a-jwt").status_code, 401)
        import jwt

        unsigned = jwt.encode(
            {"sub": str(uuid.uuid4()), "aud": "authenticated", "exp": 9999999999},
            "",
            algorithm="none",
        )
        self.assertEqual(self.post(HTTP_AUTHORIZATION=f"Bearer {unsigned}").status_code, 401)

    def test_non_uuid_subject_is_401(self):
        token = make_token(sub="not-a-uuid")
        self.assertEqual(self.post(HTTP_AUTHORIZATION=f"Bearer {token}").status_code, 401)

    def test_unconfigured_server_says_so(self):
        with patch.dict(os.environ, {"SUPABASE_JWT_SECRET": ""}):
            r = self.post(HTTP_AUTHORIZATION=f"Bearer {make_token()}")
        self.assertEqual(r.status_code, 401)
        self.assertIn("SUPABASE_JWT_SECRET", r.data["detail"])

    def test_asymmetric_token_verified_through_jwks(self):
        import jwt

        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        uid = str(uuid.uuid4())
        token = jwt.encode(
            {"sub": uid, "aud": "authenticated", "exp": 9999999999},
            key,
            algorithm="RS256",
            headers={"kid": "k1"},
        )
        fake_client = MagicMock()
        fake_client.get_signing_key_from_jwt.return_value = MagicMock(key=key.public_key())
        with patch.dict(
            os.environ, {"SUPABASE_URL": "https://x.supabase.co", "SUPABASE_JWT_SECRET": ""}
        ), patch("apps.common.supabase_auth._jwks_client", return_value=fake_client):
            self.assertEqual(self.post(HTTP_AUTHORIZATION=f"Bearer {token}").status_code, 201)
            forged = jwt.encode(
                {"sub": uid, "aud": "authenticated", "exp": 9999999999},
                rsa.generate_private_key(public_exponent=65537, key_size=2048),
                algorithm="RS256",
            )
            self.assertEqual(self.post(HTTP_AUTHORIZATION=f"Bearer {forged}").status_code, 401)

    def test_hs256_token_signed_with_public_key_confusion_rejected(self):
        # classic algorithm-confusion attack: HS256 token "signed" with something else than our secret
        token = make_token(secret="public-key-pem-used-as-hmac-secret-xxxxxxxxxxx")
        self.assertNotEqual(TEST_SECRET, "public-key-pem-used-as-hmac-secret-xxxxxxxxxxx")
        self.assertEqual(self.post(HTTP_AUTHORIZATION=f"Bearer {token}").status_code, 401)
