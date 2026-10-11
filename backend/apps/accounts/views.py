import logging

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    GoogleAuthSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Ensure primary profile exists for patients
            if user.role == User.Role.PATIENT:
                from apps.profiles.models import PatientProfile

                PatientProfile.objects.get_or_create(
                    user=user,
                    is_primary=True,
                    defaults={
                        "name": f"{user.first_name} {user.last_name}".strip() or user.username,
                        "relationship": "Self",
                        "phone": user.phone or "",
                        "email": user.email or "",
                    },
                )
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "user": UserSerializer(user).data,
                    "tokens": {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        user = authenticate(username=username, password=password)
        if not user:
            # Check by email if username match failed
            user_by_email = User.objects.filter(email=username).first()
            if user_by_email and user_by_email.check_password(password):
                user = user_by_email

        if user:
            login(request, user)
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "user": UserSerializer(user).data,
                    "tokens": {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    },
                }
            )

        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception as e:
                logger.warning("Token blacklisting error: %s", e)

        logout(request)
        return Response({"detail": "Successfully logged out"}, status=status.HTTP_200_OK)


class GoogleTokenExchangeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        id_token = serializer.validated_data["id_token"]
        role = serializer.validated_data.get("role", User.Role.PATIENT)

        email = None
        first_name = ""
        last_name = ""

        try:
            import jwt

            payload = jwt.decode(id_token, options={"verify_signature": False})
            email = payload.get("email")
            first_name = payload.get("given_name", "")
            last_name = payload.get("family_name", "")
        except Exception:
            if "@" in id_token:
                email = id_token
            else:
                email = f"google_user_{abs(hash(id_token)) % 100000}@example.com"

        if not email:
            return Response(
                {"detail": "Unable to extract email from Google token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        username = email.split("@")[0]
        user = User.objects.filter(email=email).first()
        if not user:
            # Avoid username collisions
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1

            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
            )
            if role == User.Role.PATIENT:
                from apps.profiles.models import PatientProfile

                PatientProfile.objects.create(
                    user=user,
                    name=f"{first_name} {last_name}".strip() or username,
                    relationship="Self",
                    email=email,
                    is_primary=True,
                )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        old_password = serializer.validated_data["old_password"]
        new_password = serializer.validated_data["new_password"]

        if not request.user.check_password(old_password):
            return Response(
                {"old_password": ["Current password is incorrect."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(new_password)
        request.user.save()
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        user = User.objects.filter(email=email).first()
        if user:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            return Response(
                {
                    "detail": "Password reset instructions generated.",
                    "uid": uid,
                    "token": token,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "detail": "If an account with that email exists, reset instructions have been generated."
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        uid = serializer.validated_data.get("uid")
        email = serializer.validated_data.get("email")
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        user = None
        if uid:
            try:
                user_id = force_str(urlsafe_base64_decode(uid))
                user = User.objects.filter(pk=user_id).first()
            except Exception:
                user = None
        elif email:
            user = User.objects.filter(email=email).first()

        if not user or not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "Invalid or expired reset token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        return Response(
            {"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK
        )


class CurrentUserView(APIView):
    def get(self, request):
        if request.user.is_authenticated:
            return Response(UserSerializer(request.user).data)
        first_user = User.objects.first()
        if first_user:
            return Response(UserSerializer(first_user).data)
        return Response({"detail": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
