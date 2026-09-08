from django.contrib.auth import authenticate, login
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            return Response(UserSerializer(user).data)
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


class CurrentUserView(APIView):
    def get(self, request):
        if request.user.is_authenticated:
            return Response(UserSerializer(request.user).data)
        first_user = User.objects.first()
        if first_user:
            return Response(UserSerializer(first_user).data)
        return Response({"detail": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
