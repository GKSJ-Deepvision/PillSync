from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Reminder
from .serializers import ReminderSerializer


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def reminder_list_create(request):
    if request.method == "GET":
        user = request.user
        if user and user.is_authenticated:
            from apps.medications.views import _get_queryset_for_user
            allowed_med_ids = list(_get_queryset_for_user(user).values_list("id", flat=True))
            reminders = Reminder.objects.filter(medication_id__in=allowed_med_ids).order_by("id")
        else:
            reminders = Reminder.objects.all().order_by("id")
        serializer = ReminderSerializer(reminders, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = ReminderSerializer(data=request.data)
        if serializer.is_valid():
            reminder = serializer.save()
            return Response(ReminderSerializer(reminder).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH", "PUT"])
@permission_classes([AllowAny])
def update_reminder_status(request, pk):
    try:
        reminder = Reminder.objects.get(pk=pk)
    except Reminder.DoesNotExist:
        return Response({"detail": "Reminder not found."}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get("status")
    if new_status in ["taken", "missed", "pending", "snoozed"]:
        prev_status = reminder.status
        reminder.status = new_status
        reminder.save()

        # Update reminder status without reducing medication stock
        if new_status == "taken" and prev_status != "taken":
            pass

        return Response(ReminderSerializer(reminder).data)

    return Response({"detail": "Invalid status value."}, status=status.HTTP_400_BAD_REQUEST)
