from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        if User.objects.filter(email=request.data.get("email")).exists():
            return Response(
                {"email": ["A user with this email already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh), "user": user_data},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email = (request.data.get("email") or "").strip()
    password = request.data.get("password")
    requested_role = request.data.get("role")

    if not email or not password:
        return Response(
            {"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=email, password=password)
    if not user:
        # Case-insensitive fallback query by email or username
        try:
            u = (
                User.objects.filter(email__iexact=email).first()
                or User.objects.filter(username__iexact=email).first()
            )
            if u and u.check_password(password):
                user = u
        except Exception:
            pass

    if not user:
        return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

    if requested_role:
        user._role = requested_role.lower()

    refresh = RefreshToken.for_user(user)
    user_data = UserSerializer(user).data

    return Response(
        {"access": str(refresh.access_token), "refresh": str(refresh), "user": user_data}
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def profile_view(request):
    if request.user.is_authenticated:
        return Response(UserSerializer(request.user).data)
    # Default fallback demo user profile for unauthenticated dev view
    demo_user = User.objects.first()
    if demo_user:
        return Response(UserSerializer(demo_user).data)
    return Response(
        {
            "id": 1,
            "username": "patient@pillsync.com",
            "email": "patient@pillsync.com",
            "name": "Sarah Jenkins",
            "role": "patient",
        }
    )
