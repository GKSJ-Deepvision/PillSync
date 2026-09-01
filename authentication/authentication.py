from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

class FallthroughJWTAuthentication(JWTAuthentication):
    """
    An extension of SimpleJWT's JWTAuthentication that gracefully falls through
    to subsequent authentication classes (like OAuth2Authentication) when a Bearer token
    is not a valid JWT token.
    """
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, TokenError):
            return None
