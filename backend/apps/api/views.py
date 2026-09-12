# from rest_framework import status
# from rest_framework.response import Response
# from rest_framework.views import APIView

# from .serializers import UserRegistrationSerializer

from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.medicines.models import MedicationHistory, Medicine, MedicineSchedule
from apps.profiles.models import Profile
from apps.reminders.models import Reminder

from .serializers import (
    MedicationHistorySerializer,
    MedicineScheduleSerializer,
    MedicineSerializer,
    ProfileSerializer,
    ReminderSerializer,
    ReminderSnoozeSerializer,
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


class MedicationHistoryListCreateView(APIView):
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

        history = (
            MedicationHistory.objects.filter(
                medicine=medicine,
            )
            .select_related(
                "schedule",
                "medicine",
            )
            .order_by("-scheduled_at")
        )

        serializer = MedicationHistorySerializer(
            history,
            many=True,
            context={"request": request},
        )
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

        serializer = MedicationHistorySerializer(
            data=request.data,
            context={"request": request},
        )

        if serializer.is_valid():
            schedule = serializer.validated_data["schedule"]

            if schedule.medicine_id != medicine.id:
                return Response(
                    {"detail": "Schedule does not belong to this medicine."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            history = serializer.save(
                medicine=medicine,
                dose=schedule.dose,
            )

            return Response(
                MedicationHistorySerializer(
                    history,
                    context={"request": request},
                ).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class MedicationHistoryDetailView(APIView):
    def get_history(self, request, pk):
        return (
            MedicationHistory.objects.filter(
                id=pk,
                medicine__user=request.user,
                medicine__is_active=True,
            )
            .select_related(
                "schedule",
                "medicine",
            )
            .first()
        )

    def get(self, request, pk):
        history = self.get_history(request, pk)

        if history is None:
            return Response(
                {"detail": "Medication history not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MedicationHistorySerializer(
            history,
            context={"request": request},
        )
        return Response(serializer.data)

    def put(self, request, pk):
        history = self.get_history(request, pk)

        if history is None:
            return Response(
                {"detail": "Medication history not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MedicationHistorySerializer(
            history,
            data=request.data,
            context={"request": request},
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def patch(self, request, pk):
        history = self.get_history(request, pk)

        if history is None:
            return Response(
                {"detail": "Medication history not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MedicationHistorySerializer(
            history,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class ReminderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reminders = Reminder.objects.filter(schedule__medicine__user=request.user).select_related(
            "schedule",
            "schedule__medicine",
        )

        serializer = ReminderSerializer(
            reminders,
            many=True,
        )

        return Response(serializer.data)


class ReminderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            reminder = Reminder.objects.select_related(
                "schedule",
                "schedule__medicine",
            ).get(
                pk=pk,
                schedule__medicine__user=request.user,
            )
        except Reminder.DoesNotExist:
            return Response(
                {"detail": "Reminder not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ReminderSerializer(reminder)

        return Response(serializer.data)


class ReminderTakenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            reminder = Reminder.objects.select_related(
                "schedule",
                "schedule__medicine",
            ).get(
                pk=pk,
                schedule__medicine__user=request.user,
            )
        except Reminder.DoesNotExist:
            return Response(
                {"detail": "Reminder not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if reminder.status == Reminder.Status.TAKEN:
            return Response(
                {"detail": "Reminder has already been marked as taken."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        history, created = MedicationHistory.objects.get_or_create(
            schedule=reminder.schedule,
            scheduled_at=reminder.scheduled_at,
            defaults={
                "medicine": reminder.schedule.medicine,
                "dose": reminder.schedule.dose,
                "status": MedicationHistory.Status.TAKEN,
                "taken_at": timezone.now(),
            },
        )

        if not created:
            history.status = MedicationHistory.Status.TAKEN
            history.taken_at = timezone.now()
            history.save(update_fields=["status", "taken_at", "updated_at"])

        reminder.status = Reminder.Status.TAKEN
        reminder.snoozed_until = None
        reminder.save(update_fields=["status", "snoozed_until", "updated_at"])

        return Response(ReminderSerializer(reminder).data)


class ReminderMissedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            reminder = Reminder.objects.select_related(
                "schedule",
                "schedule__medicine",
            ).get(
                pk=pk,
                schedule__medicine__user=request.user,
            )
        except Reminder.DoesNotExist:
            return Response(
                {"detail": "Reminder not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if reminder.status == Reminder.Status.MISSED:
            return Response(
                {"detail": "Reminder has already been marked as missed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        history, created = MedicationHistory.objects.get_or_create(
            schedule=reminder.schedule,
            scheduled_at=reminder.scheduled_at,
            defaults={
                "medicine": reminder.schedule.medicine,
                "dose": reminder.schedule.dose,
                "status": MedicationHistory.Status.MISSED,
            },
        )

        if not created:
            history.status = MedicationHistory.Status.MISSED
            history.taken_at = None
            history.save(update_fields=["status", "taken_at", "updated_at"])

        reminder.status = Reminder.Status.MISSED
        reminder.snoozed_until = None
        reminder.save(update_fields=["status", "snoozed_until", "updated_at"])

        return Response(ReminderSerializer(reminder).data)


class ReminderSnoozeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            reminder = Reminder.objects.select_related(
                "schedule",
                "schedule__medicine",
            ).get(
                pk=pk,
                schedule__medicine__user=request.user,
            )
        except Reminder.DoesNotExist:
            return Response(
                {"detail": "Reminder not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if reminder.status in [
            Reminder.Status.TAKEN,
            Reminder.Status.MISSED,
        ]:
            return Response(
                {"detail": "Completed reminders cannot be snoozed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReminderSnoozeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reminder.status = Reminder.Status.SNOOZED
        reminder.snoozed_until = timezone.now() + timedelta(
            minutes=serializer.validated_data["minutes"]
        )
        reminder.save(
            update_fields=[
                "status",
                "snoozed_until",
                "updated_at",
            ]
        )

        return Response(ReminderSerializer(reminder).data)
