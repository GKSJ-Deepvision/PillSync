from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Reminder
from .serializers import ReminderSerializer


class ReminderListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reminders = Reminder.objects.filter(
            schedule__dosage__medicine__user=request.user
        ).order_by("reminder_date", "scheduled_time")

        serializer = ReminderSerializer(reminders, many=True)

        return Response(serializer.data)

    def post(self, request):
        serializer = ReminderSerializer(data=request.data)

        if serializer.is_valid():
            schedule = serializer.validated_data["schedule"]

            if schedule.dosage.medicine.user != request.user:
                return Response(
                    {"detail": "You can only create reminders for your medicines."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            reminder = serializer.save()
            return Response(
                ReminderSerializer(reminder).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class ReminderActionView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            reminder = Reminder.objects.get(
                pk=pk,
                schedule__dosage__medicine__user=request.user,
            )
        except Reminder.DoesNotExist:
            return Response(
                {"detail": "Reminder not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        action = request.data.get("action")

        if action == "TAKEN":
            reminder.status = Reminder.Status.TAKEN
            reminder.snoozed_until = None

        elif action == "MISSED":
            reminder.status = Reminder.Status.MISSED
            reminder.snoozed_until = None

        elif action == "SNOOZED":
            snoozed_until = request.data.get("snoozed_until")

            if not snoozed_until:
                return Response(
                    {"detail": "snoozed_until is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            reminder.status = Reminder.Status.SNOOZED
            reminder.snoozed_until = snoozed_until

        else:
            return Response(
                {
                    "detail": (
                        "Invalid action. Use TAKEN, MISSED, or SNOOZED."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reminder.save()

        return Response(ReminderSerializer(reminder).data)