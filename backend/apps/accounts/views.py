from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, RegisterSerializer

@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        if User.objects.filter(email=request.data.get("email")).exists():
            return Response({"email": ["A user with this email already exists."]}, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": user_data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=email, password=password)
    if not user:
        # Fallback query if username != email
        try:
            u = User.objects.get(email=email)
            if u.check_password(password):
                user = u
        except User.DoesNotExist:
            pass

    if not user:
        return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    user_data = UserSerializer(user).data
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": user_data
    })

@api_view(["GET"])
@permission_classes([AllowAny])
def profile_view(request):
    if request.user.is_authenticated:
        return Response(UserSerializer(request.user).data)
    # Default fallback demo user profile for unauthenticated dev view
    demo_user = User.objects.first()
    if demo_user:
        return Response(UserSerializer(demo_user).data)
    return Response({
        "id": 1,
        "username": "patient@pillsync.com",
        "email": "patient@pillsync.com",
        "name": "Sarah Jenkins",
        "role": "patient"
    })
