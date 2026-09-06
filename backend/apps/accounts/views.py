from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin, IsCaregiver, IsPatient
from apps.accounts.schemas import (
    LoginSerializer,
    RoleAccessResponseSerializer,
    TokenResponseSerializer,
    UserRegisterSerializer,
    UserResponseSerializer,
)


@extend_schema(
    tags=["Authentication"],
    request=UserRegisterSerializer,
    responses={201: UserResponseSerializer},
    summary="Register a new user",
    description="Creates a new PillSync user with a Patient, Caregiver, or Admin role.",
)
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                UserResponseSerializer(user).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


@extend_schema(
    tags=["Authentication"],
    request=LoginSerializer,
    responses={200: TokenResponseSerializer},
    summary="Login",
    description="Authenticates a user and returns JWT access and refresh tokens.",
)
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = User.objects.filter(email=email).first()

        if user is None or not user.check_password(password):
            return Response(
                {"detail": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role

        return Response(
            {
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "token_type": "bearer",
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Authentication"],
    responses={200: UserResponseSerializer},
    summary="Get current user",
    description="Returns the currently authenticated user's details.",
)
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            UserResponseSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Role Based Access"],
    responses={200: RoleAccessResponseSerializer},
    summary="Patient-only endpoint",
    description="Accessible only to authenticated Patient users.",
)
class PatientOnlyView(APIView):
    permission_classes = [IsPatient]

    def get(self, request):
        return Response(
            {
                "message": "Patient access granted",
                "user": request.user.full_name,
                "role": request.user.role,
            }
        )


@extend_schema(
    tags=["Role Based Access"],
    responses={200: RoleAccessResponseSerializer},
    summary="Caregiver-only endpoint",
    description="Accessible only to authenticated Caregiver users.",
)
class CaregiverOnlyView(APIView):
    permission_classes = [IsCaregiver]

    def get(self, request):
        return Response(
            {
                "message": "Caregiver access granted",
                "user": request.user.full_name,
                "role": request.user.role,
            }
        )


@extend_schema(
    tags=["Role Based Access"],
    responses={200: RoleAccessResponseSerializer},
    summary="Admin-only endpoint",
    description="Accessible only to authenticated Admin users.",
)
class AdminOnlyView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(
            {
                "message": "Admin access granted",
                "user": request.user.full_name,
                "role": request.user.role,
            }
        )
