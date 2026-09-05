# from rest_framework import status
# from rest_framework.response import Response
# from rest_framework.views import APIView

# from .serializers import UserRegistrationSerializer

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.medicines.models import Medicine, MedicineSchedule
from apps.profiles.models import Profile

from .serializers import (
    MedicineScheduleSerializer,
    MedicineSerializer,
    ProfileSerializer,
    UserRegistrationSerializer,
)


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "PillSync API",
            }
        )


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
        return Response(
            {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "role": request.user.role,
            }
        )


class ProfileView(APIView):
    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile)

        return Response(serializer.data)

    def put(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
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


class MedicineScheduleListCreateView(APIView):
    def get(self, request, medicine_id):
        medicine = Medicine.objects.filter(
            id=medicine_id,
            user=request.user,
            is_active=True,
        ).first()

        if medicine is None:
            return Response(
                {"detail": "Medicine not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        schedules = MedicineSchedule.objects.filter(
            medicine=medicine,
            is_active=True,
        ).order_by("time")

        serializer = MedicineScheduleSerializer(schedules, many=True)
        return Response(serializer.data)

    def post(self, request, medicine_id):
        medicine = Medicine.objects.filter(
            id=medicine_id,
            user=request.user,
            is_active=True,
        ).first()

        if medicine is None:
            return Response(
                {"detail": "Medicine not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MedicineScheduleSerializer(data=request.data)

        if serializer.is_valid():
            schedule = serializer.save(medicine=medicine)

            return Response(
                MedicineScheduleSerializer(schedule).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class MedicineScheduleDetailView(APIView):
    def get_schedule(self, request, pk):
        return MedicineSchedule.objects.filter(
            id=pk,
            medicine__user=request.user,
            medicine__is_active=True,
        ).first()

    def put(self, request, pk):
        schedule = self.get_schedule(request, pk)

        if schedule is None:
            return Response(
                {"detail": "Schedule not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MedicineScheduleSerializer(
            schedule,
            data=request.data,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def patch(self, request, pk):
        schedule = self.get_schedule(request, pk)

        if schedule is None:
            return Response(
                {"detail": "Schedule not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MedicineScheduleSerializer(
            schedule,
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

    def delete(self, request, pk):
        schedule = self.get_schedule(request, pk)

        if schedule is None:
            return Response(
                {"detail": "Schedule not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        schedule.is_active = False
        schedule.save(update_fields=["is_active", "updated_at"])

        return Response(status=status.HTTP_204_NO_CONTENT)
