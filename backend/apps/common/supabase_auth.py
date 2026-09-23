"""
Authenticate API requests with the Supabase access token the React app already has.

The frontend sends   Authorization: Bearer <supabase access_token>.
We verify the signature and expiry, and the token's `sub` becomes the patient id, so a client can
never act as somebody else by putting a different patient_id in the request body.

Configure ONE of these in backend/.env (Supabase dashboard -> Project Settings -> API):
  SUPABASE_JWT_SECRET   projects that sign tokens with the shared "JWT Secret" (HS256)
  SUPABASE_URL          projects with asymmetric signing keys (RS256/ES256, verified via JWKS)
"""

import os
import uuid

import jwt
from jwt import PyJWKClient
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

AUDIENCE = "authenticated"
_jwks_clients: dict[str, PyJWKClient] = {}


class SupabaseUser:
    """Minimal stand-in for request.user (there is no Django user table for Supabase users)."""

    is_authenticated = True
    is_anonymous = False

    def __init__(self, user_id: str, email: str = ""):
        self.id = user_id
        self.pk = user_id
        self.email = email

    def __str__(self) -> str:
        return self.id


def _jwks_client(base_url: str) -> PyJWKClient:
    url = base_url.rstrip("/") + "/auth/v1/.well-known/jwks.json"
    if url not in _jwks_clients:
        _jwks_clients[url] = PyJWKClient(url, cache_keys=True)
    return _jwks_clients[url]


def decode_token(token: str) -> dict:
    try:
        alg = jwt.get_unverified_header(token).get("alg", "")
    except jwt.PyJWTError as exc:
        raise AuthenticationFailed("Malformed token.") from exc

    options = {"require": ["exp", "sub"]}
    try:
        if alg == "HS256":
            secret = os.environ.get("SUPABASE_JWT_SECRET", "")
            if not secret:
                raise AuthenticationFailed(
                    "Server auth is not configured: set SUPABASE_JWT_SECRET in backend/.env."
                )
            return jwt.decode(
                token, secret, algorithms=["HS256"], audience=AUDIENCE, options=options
            )
        if alg in ("RS256", "ES256"):
            base_url = os.environ.get("SUPABASE_URL", "")
            if not base_url:
                raise AuthenticationFailed(
                    "Server auth is not configured: set SUPABASE_URL in backend/.env."
                )
            key = _jwks_client(base_url).get_signing_key_from_jwt(token).key
            return jwt.decode(
                token, key, algorithms=["RS256", "ES256"], audience=AUDIENCE, options=options
            )
    except jwt.PyJWTError as exc:
        raise AuthenticationFailed("Invalid or expired token.") from exc
    raise AuthenticationFailed("Unsupported token algorithm.")


class SupabaseJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        parts = get_authorization_header(request).split()
        if not parts or parts[0].lower() != b"bearer":
            return None
        if len(parts) != 2:
            raise AuthenticationFailed("Malformed Authorization header.")
        claims = decode_token(parts[1].decode())
        try:
            user_id = str(uuid.UUID(str(claims["sub"])))
        except ValueError as exc:
            raise AuthenticationFailed("Invalid token subject.") from exc
        return SupabaseUser(user_id, claims.get("email", "")), claims

    def authenticate_header(self, request):
        return "Bearer"
