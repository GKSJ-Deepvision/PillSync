from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import (
    UserRegisterSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    SessionLoginSerializer,
)

User = get_user_model()


class RegisterView(views.APIView):
    """
    API endpoint for user registration.
    Accessible by anyone.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully"},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(views.APIView):
    """
    Protected API endpoint to get the authenticated user's profile.
    Requires valid JWT, OAuth2 token, or active Session.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChangePasswordView(views.APIView):
    """
    API endpoint for authenticated users to change their password.
    Requires current password verification and a strong new password.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response(
                {"message": "Password changed successfully."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(views.APIView):
    """
    API endpoint to initiate a password reset.
    Generates a secure reset token and sends it via email (or logs to console in dev).
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email__iexact=email)
            
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            
            reset_url = f"/api/auth/password-reset/confirm/?uidb64={uidb64}&token={token}"
            
            # Send email (Console backend will print this to standard output in development)
            subject = "PillSync - Password Reset Request"
            message = (
                f"Hello {user.username},\n\n"
                f"You requested a password reset for your PillSync account.\n"
                f"Use the following credentials to reset your password:\n\n"
                f"uidb64: {uidb64}\n"
                f"token: {token}\n\n"
                f"Reset Endpoint: {reset_url}\n\n"
                f"If you did not request this, please ignore this email."
            )
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

            response_data = {
                "message": "Password reset instructions have been sent to your email."
            }
            # For development convenience, include debug tokens if DEBUG is True
            if settings.DEBUG:
                response_data["dev_info"] = {
                    "uidb64": uidb64,
                    "token": token,
                    "reset_url": reset_url
                }

            return Response(response_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(views.APIView):
    """
    API endpoint to confirm password reset using uidb64, token, and new password.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            new_password = serializer.validated_data['new_password']
            user.set_password(new_password)
            user.save()
            return Response(
                {"message": "Password has been reset successfully."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SessionLoginView(views.APIView):
    """
    API endpoint for Django Session-based login.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = SessionLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(request, username=username, password=password)
            if user is not None:
                if not user.is_active:
                    return Response({"error": "User account is disabled."}, status=status.HTTP_403_FORBIDDEN)
                login(request, user)
                return Response(
                    {
                        "message": "Session login successful.",
                        "user": UserSerializer(user).data
                    },
                    status=status.HTTP_200_OK
                )
            return Response({"error": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SessionLogoutView(views.APIView):
    """
    API endpoint for Django Session-based logout.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logout(request)
        return Response({"message": "Session logged out successfully."}, status=status.HTTP_200_OK)


class LogoutView(views.APIView):
    """
    API endpoint to invalidate/blacklist a JWT refresh token upon logout.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out. Token has been blacklisted."}, status=status.HTTP_200_OK)
        except TokenError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
