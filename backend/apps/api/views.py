# from rest_framework import status
# from rest_framework.response import Response
# from rest_framework.views import APIView

# from .serializers import UserRegistrationSerializer

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.medicines.models import Medicine

from apps.profiles.models import Profile

from .serializers import (
    UserRegistrationSerializer,
    ProfileSerializer,
    MedicineSerializer,
)



class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({
            "status": "ok",
            "service": "PillSync API",
        })


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": "User registered successfully.",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": user.role,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

class MeView(APIView):
    def get(self, request):
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "role": request.user.role,
        })
        
class ProfileView(APIView):
    def get(self, request):
        profile = Profile.objects.get(user=request.user)
        serializer = ProfileSerializer(profile)

        return Response(serializer.data)

    def put(self, request):
        profile = Profile.objects.get(user=request.user)
        serializer = ProfileSerializer(
            profile,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
        
class MedicineListCreateView(APIView):
    def get(self, request):
        medicines = Medicine.objects.filter(
            user=request.user,
            is_active=True,
        )

        serializer = MedicineSerializer(medicines, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MedicineSerializer(data=request.data)

        if serializer.is_valid():
            medicine = serializer.save(user=request.user)
            return Response(
                MedicineSerializer(medicine).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )