from datetime import date, timedelta

from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.adherence.models import DoseEvent, DoseEventStatus
from apps.adherence.serializers import (
    DoseEventSerializer,
    DoseEventWriteSerializer,
    TodayDoseSerializer,
)
from apps.adherence.services.metrics import (
    build_daily_history,
    calculate_medication_breakdown,
    calculate_report,
    calculate_streak,
    calculate_summary,
    get_dose_logs,
    get_patient_schedules,
    is_schedule_due,
)


def _get_patient_or_error(request):
    if request.user.role != UserRole.PATIENT:
        return None, Response(
            {"detail": ("Only patients can access adherence analytics.")},
            status=status.HTTP_403_FORBIDDEN,
        )

    return request.user, None


def _parse_date(value, field_name):
    if not value:
        return None, None

    try:
        return date.fromisoformat(value), None
    except ValueError:
        return None, Response(
            {field_name: "Use ISO format YYYY-MM-DD."},
            status=status.HTTP_400_BAD_REQUEST,
        )


def _get_date_range(request):
    today = timezone.localdate()

    start_date, error = _parse_date(
        request.query_params.get("start_date"),
        "start_date",
    )

    if error:
        return None, None, error

    end_date, error = _parse_date(
        request.query_params.get("end_date"),
        "end_date",
    )

    if error:
        return None, None, error

    if not start_date and not end_date:
        end_date = today
        start_date = end_date - timedelta(days=6)
    elif start_date and not end_date:
        end_date = today
    elif end_date and not start_date:
        start_date = end_date - timedelta(days=6)

    if start_date > end_date:
        return (
            None,
            None,
            Response(
                {"detail": ("start_date must be on or before end_date.")},
                status=status.HTTP_400_BAD_REQUEST,
            ),
        )

    if (end_date - start_date).days > 366:
        return (
            None,
            None,
            Response(
                {"detail": "Date range cannot exceed 366 days."},
                status=status.HTTP_400_BAD_REQUEST,
            ),
        )

    return start_date, end_date, None


class SummaryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Adherence"],
        summary="Get adherence summary",
    )
    def get(self, request):
        patient, error = _get_patient_or_error(request)

        if error:
            return error

        start_date, end_date, error = _get_date_range(request)

        if error:
            return error

        history = build_daily_history(
            patient,
            start_date,
            end_date,
        )

        summary = calculate_summary(history)

        summary["current_streak"] = calculate_streak(history)
        summary["start_date"] = start_date
        summary["end_date"] = end_date

        return Response(summary)


class HistoryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Adherence"],
        summary="Get daily adherence history",
    )
    def get(self, request):
        patient, error = _get_patient_or_error(request)

        if error:
            return error

        start_date, end_date, error = _get_date_range(request)

        if error:
            return error

        history = build_daily_history(
            patient,
            start_date,
            end_date,
        )

        return Response(history)


class MedicationBreakdownView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Adherence"],
        summary="Get adherence by medication",
    )
    def get(self, request):
        patient, error = _get_patient_or_error(request)

        if error:
            return error

        start_date, end_date, error = _get_date_range(request)

        if error:
            return error

        result = calculate_medication_breakdown(
            patient,
            start_date,
            end_date,
        )

        return Response(result)


class TodayView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Adherence"],
        summary="Get today's scheduled doses",
    )
    def get(self, request):
        patient, error = _get_patient_or_error(request)

        if error:
            return error

        today = timezone.localdate()

        schedules = get_patient_schedules(
            patient,
            today,
            today,
        )

        logs = get_dose_logs(
            schedules,
            today,
            today,
        )

        now = timezone.localtime()
        doses = []

        for schedule in schedules:
            if not is_schedule_due(schedule, today):
                continue

            event = logs.get((schedule.id, today))

            if event:
                if (
                    event.status == DoseEventStatus.SNOOZED
                    and event.snoozed_until
                    and event.snoozed_until > now
                ):
                    display_status = "PENDING"
                else:
                    display_status = event.status
            elif schedule.scheduled_time > now.time():
                display_status = "PENDING"
            else:
                display_status = "MISSED"

            doses.append(
                {
                    "schedule_id": schedule.id,
                    "medicine_id": schedule.dosage.medicine_id,
                    "medicine_name": (schedule.dosage.medicine.medicine_name),
                    "scheduled_time": schedule.scheduled_time,
                    "time_of_day": schedule.time_of_day,
                    "dose_date": today,
                    "status": display_status,
                    "event_id": event.id if event else None,
                    "taken_at": event.taken_at if event else None,
                    "snoozed_until": (event.snoozed_until if event else None),
                    "note": event.note if event else "",
                }
            )

        doses.sort(key=lambda item: item["scheduled_time"])

        serializer = TodayDoseSerializer(
            doses,
            many=True,
        )

        return Response(serializer.data)


class DoseEventCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Adherence"],
        summary="Log a medication dose",
    )
    @transaction.atomic
    def post(self, request):
        patient, error = _get_patient_or_error(request)

        if error:
            return error

        serializer = DoseEventWriteSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        schedule = serializer.validated_data["schedule"]
        dose_date = serializer.validated_data["dose_date"]
        dose_status = serializer.validated_data["status"]
        note = serializer.validated_data.get("note", "")
        snoozed_until = serializer.validated_data.get("snoozed_until")

        today = timezone.localdate()

        if dose_date > today:
            return Response(
                {"detail": ("A future dose cannot be marked " "as taken or missed.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not is_schedule_due(
            schedule,
            dose_date,
        ):
            return Response(
                {"detail": ("This medication is not scheduled " "for the selected date.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event, _ = DoseEvent.objects.get_or_create(
            schedule=schedule,
            dose_date=dose_date,
            defaults={
                "status": dose_status,
            },
        )

        now = timezone.now()

        event.status = dose_status
        event.note = note

        if dose_status == DoseEventStatus.TAKEN:
            event.taken_at = now
            event.missed_at = None
            event.snoozed_at = None
            event.snoozed_until = None

        elif dose_status == DoseEventStatus.MISSED:
            event.missed_at = now
            event.taken_at = None
            event.snoozed_at = None
            event.snoozed_until = None

        elif dose_status == DoseEventStatus.SNOOZED:
            event.snoozed_at = now
            event.snoozed_until = snoozed_until
            event.taken_at = None
            event.missed_at = None

        event.save()

        return Response(
            DoseEventSerializer(event).data,
            status=status.HTTP_200_OK,
        )


class DoseEventUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Adherence"],
        summary="Update a medication dose event",
    )
    @transaction.atomic
    def patch(self, request, pk):
        patient, error = _get_patient_or_error(request)

        if error:
            return error

        try:
            event = DoseEvent.objects.select_related("schedule__dosage__medicine").get(pk=pk)
        except DoseEvent.DoesNotExist:
            return Response(
                {"detail": "Dose event not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if event.schedule.dosage.medicine.patient_id != patient.id:
            return Response(
                {"detail": ("You do not have permission " "to update this dose event.")},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = {
            "schedule": request.data.get(
                "schedule",
                event.schedule_id,
            ),
            "dose_date": request.data.get(
                "dose_date",
                event.dose_date,
            ),
            "status": request.data.get(
                "status",
                event.status,
            ),
            "note": request.data.get(
                "note",
                event.note,
            ),
            "snoozed_until": request.data.get(
                "snoozed_until",
                event.snoozed_until,
            ),
        }

        serializer = DoseEventWriteSerializer(
            data=data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        status_value = serializer.validated_data["status"]

        event.status = status_value
        event.note = serializer.validated_data.get(
            "note",
            event.note,
        )

        if status_value == DoseEventStatus.TAKEN:
            event.taken_at = timezone.now()
            event.missed_at = None
            event.snoozed_at = None
            event.snoozed_until = None

        elif status_value == DoseEventStatus.MISSED:
            event.missed_at = timezone.now()
            event.taken_at = None
            event.snoozed_at = None
            event.snoozed_until = None

        else:
            event.snoozed_at = timezone.now()
            event.snoozed_until = serializer.validated_data.get("snoozed_until")
            event.taken_at = None
            event.missed_at = None

        event.save()

        return Response(DoseEventSerializer(event).data)


class WeeklyView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Adherence"],
        summary="Get weekly adherence",
    )
    def get(self, request):
        patient, error = _get_patient_or_error(request)

        if error:
            return error

        end_date = timezone.localdate()
        start_date = end_date - timedelta(days=6)

        history = build_daily_history(
            patient,
            start_date,
            end_date,
        )

        return Response(history)


class MonthlyView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Adherence"],
        summary="Get monthly adherence",
    )
    def get(self, request):
        patient, error = _get_patient_or_error(request)

        if error:
            return error

        today = timezone.localdate()

        try:
            month = int(
                request.query_params.get(
                    "month",
                    today.month,
                )
            )
            year = int(
                request.query_params.get(
                    "year",
                    today.year,
                )
            )
        except (TypeError, ValueError):
            return Response(
                {"detail": ("month and year must be integers.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not 1 <= month <= 12:
            return Response(
                {"month": ("month must be between 1 and 12.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            start_date = date(year, month, 1)

            if month == 12:
                next_month = date(year + 1, 1, 1)
            else:
                next_month = date(year, month + 1, 1)

            end_date = next_month - timedelta(days=1)

        except ValueError:
            return Response(
                {"year": "Invalid year."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        history = build_daily_history(
            patient,
            start_date,
            end_date,
        )

        return Response(
            {
                "month": month,
                "year": year,
                "history": history,
            }
        )


class ReportView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Adherence"],
        summary="Get complete adherence report",
    )
    def get(self, request):
        patient, error = _get_patient_or_error(request)

        if error:
            return error

        start_date, end_date, error = _get_date_range(request)

        if error:
            return error

        report = calculate_report(
            patient,
            start_date,
            end_date,
        )

        return Response(report)
