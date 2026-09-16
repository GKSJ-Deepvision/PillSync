from datetime import datetime, timedelta
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Medication, MedicationHistory, MedicationSchedule
from .serializers import (
    MedicationHistorySerializer,
    MedicationScheduleSerializer,
    MedicationSerializer,
)

ERR_NOT_OWNER = "You do not own this medication schedule."
ERR_SCHEDULE_NOT_FOUND = "Dosage schedule not found."


def _get_schedule(schedule_id, user):
    queryset = MedicationSchedule.objects.select_related("medication")
    if user:
        queryset = queryset.filter(medication__owner=user)
    try:
        return queryset.get(pk=schedule_id)
    except MedicationSchedule.DoesNotExist as exc:
        raise NotFound(ERR_SCHEDULE_NOT_FOUND) from exc


def _parse_date(date_value):
    if date_value:
        try:
            return datetime.strptime(date_value, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            pass
    return timezone.now().date()


class MedicationViewSet(viewsets.ModelViewSet):
    serializer_class = MedicationSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            queryset = Medication.objects.filter(owner=user)
        else:
            queryset = Medication.objects.all()

        disease = self.request.query_params.get("disease") or self.request.query_params.get("disease_category")
        if disease:
            queryset = queryset.filter(
                Q(disease_category__iexact=disease) | Q(disease_category__icontains=disease)
            )

        status_param = self.request.query_params.get("status")
        if status_param:
            if status_param.lower() == "active":
                queryset = queryset.filter(is_active=True)
            elif status_param.lower() in ["completed", "inactive"]:
                queryset = queryset.filter(is_active=False)

        search_query = self.request.query_params.get("q")
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) | Q(disease_category__icontains=search_query)
            )

        return queryset

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(owner=user)

    @action(detail=False, methods=["get"])
    def search(self, request):
        query = request.query_params.get("q", "")
        meds = self.get_queryset().filter(name__icontains=query)
        serializer = self.get_serializer(meds, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="disease/(?P<disease>[^/.]+)")
    def by_disease(self, request, disease=None):
        meds = self.get_queryset().filter(disease_category__iexact=disease)
        serializer = self.get_serializer(meds, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get", "post"], url_path="schedules")
    def schedules(self, request, pk=None):
        medication = self.get_object()
        if request.method == "GET":
            serializer = MedicationScheduleSerializer(medication.schedules.all(), many=True)
            return Response(serializer.data)

        serializer = MedicationScheduleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(medication=medication)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DosageScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = MedicationScheduleSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            queryset = MedicationSchedule.objects.filter(medication__owner=user)
        else:
            queryset = MedicationSchedule.objects.all()

        medication_id = self.request.query_params.get("medication")
        if medication_id:
            queryset = queryset.filter(medication_id=medication_id)
        return queryset

    def perform_create(self, serializer):
        medication = serializer.validated_data.get("medication")
        if medication and self.request.user.is_authenticated and medication.owner != self.request.user:
            raise PermissionDenied("You do not own this medication.")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.is_authenticated and serializer.instance.medication.owner != self.request.user:
            raise PermissionDenied(ERR_NOT_OWNER)
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.is_authenticated and instance.medication.owner != self.request.user:
            raise PermissionDenied(ERR_NOT_OWNER)
        instance.delete()


class TodayScheduleAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    @staticmethod
    def _day_matches(days_of_week, day_index, day_abbr):
        for day in days_of_week or []:
            if isinstance(day, int) and day == day_index:
                return True
            if isinstance(day, str) and day.lower()[:3] == day_abbr:
                return True
        return False

    def get(self, request):
        user = request.user
        date_str = request.query_params.get("date")
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                target_date = timezone.now().date()
        else:
            target_date = timezone.now().date()

        day_index = target_date.weekday()
        day_abbr = target_date.strftime("%a").lower()[:3]
        now_dt = timezone.now()

        owner_filter = {"owner": user} if user.is_authenticated else {}
        medications = Medication.objects.filter(
            **owner_filter,
            is_active=True,
            start_date__lte=target_date,
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=target_date)
        )

        doses = []
        for med in medications:
            for sched in med.schedules.filter(is_active=True):
                if not self._day_matches(sched.days_of_week, day_index, day_abbr):
                    continue

                combined = datetime.combine(target_date, sched.exact_time)
                scheduled_dt = combined if not timezone.is_naive(combined) else timezone.make_aware(combined)

                history = MedicationHistory.objects.filter(
                    medication=med,
                    dosage_schedule=sched,
                    scheduled_datetime__date=target_date,
                ).first()

                if history:
                    current_status = history.status
                    taken_time = history.taken_datetime
                else:
                    current_status = "missed" if scheduled_dt < now_dt else "upcoming"
                    taken_time = None

                time_formatted = sched.exact_time.strftime("%I:%M %p")

                doses.append(
                    {
                        "id": sched.id,
                        "schedule_id": sched.id,
                        "medication_id": med.id,
                        "medicationName": med.name,
                        "medication_name": med.name,
                        "dosage": med.dosage,
                        "disease": med.disease,
                        "scheduled_time": time_formatted,
                        "time": time_formatted,
                        "window": sched.window,
                        "schedule": sched.window,
                        "status": current_status,
                        "instructions": med.instructions,
                        "date": str(target_date),
                        "taken_datetime": taken_time,
                    }
                )

        doses.sort(key=lambda d: d["time"])
        return Response(
            {
                "date": str(target_date),
                "doses": doses,
            },
            status=status.HTTP_200_OK,
        )


class MarkDoseTakenAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, schedule_id):
        user = request.user if request.user.is_authenticated else None
        schedule = _get_schedule(schedule_id, user)
        target_date = _parse_date(request.data.get("date"))
        scheduled_dt = timezone.make_aware(datetime.combine(target_date, schedule.exact_time))
        now = timezone.now()
        notes = request.data.get("notes", "")

        history, _created = MedicationHistory.objects.update_or_create(
            medication=schedule.medication,
            dosage_schedule=schedule,
            scheduled_datetime=scheduled_dt,
            defaults={
                "user": user or schedule.medication.owner,
                "status": MedicationHistory.Status.TAKEN,
                "taken_datetime": now,
                "notes": notes,
            },
        )

        if schedule.medication.quantity_remaining > 0 and _created:
            schedule.medication.quantity_remaining -= 1
            schedule.medication.save(update_fields=["quantity_remaining"])

        return Response(
            {
                "success": True,
                "status": "taken",
                "taken_datetime": now.isoformat(),
                "history_id": history.id,
                "message": f"Dose for {schedule.medication.name} marked as taken.",
            },
            status=status.HTTP_200_OK,
        )


class MarkDoseSkippedAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, schedule_id):
        user = request.user if request.user.is_authenticated else None
        schedule = _get_schedule(schedule_id, user)
        target_date = _parse_date(request.data.get("date"))
        scheduled_dt = timezone.make_aware(datetime.combine(target_date, schedule.exact_time))
        notes = request.data.get("notes", "Skipped by patient")

        history, _ = MedicationHistory.objects.update_or_create(
            medication=schedule.medication,
            dosage_schedule=schedule,
            scheduled_datetime=scheduled_dt,
            defaults={
                "user": user or schedule.medication.owner,
                "status": MedicationHistory.Status.SKIPPED,
                "notes": notes,
            },
        )

        return Response(
            {
                "success": True,
                "status": "skipped",
                "history_id": history.id,
                "message": f"Dose for {schedule.medication.name} marked as skipped.",
            },
            status=status.HTTP_200_OK,
        )


class MarkDoseSnoozedAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, schedule_id):
        user = request.user if request.user.is_authenticated else None
        schedule = _get_schedule(schedule_id, user)
        target_date = _parse_date(request.data.get("date"))
        scheduled_dt = timezone.make_aware(datetime.combine(target_date, schedule.exact_time))
        snoozed_until = timezone.now() + timedelta(minutes=int(request.data.get("minutes", 30)))
        history, _ = MedicationHistory.objects.update_or_create(
            medication=schedule.medication,
            dosage_schedule=schedule,
            scheduled_datetime=scheduled_dt,
            defaults={
                "user": user or schedule.medication.owner,
                "status": MedicationHistory.Status.SNOOZED,
                "taken_datetime": None,
                "notes": request.data.get("notes", "Dose snoozed"),
            },
        )

        return Response(
            {
                "success": True,
                "status": "snoozed",
                "snoozed_until": snoozed_until.isoformat(),
                "history_id": history.id,
            },
            status=status.HTTP_200_OK,
        )


class MedicationHistoryAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = request.user
        if user.is_authenticated:
            queryset = MedicationHistory.objects.filter(user=user)
        else:
            queryset = MedicationHistory.objects.all()

        medication_id = request.query_params.get("medication")
        if medication_id:
            queryset = queryset.filter(medication_id=medication_id)

        status_param = request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status__iexact=status_param)

        date_param = request.query_params.get("date")
        if date_param:
            queryset = queryset.filter(scheduled_datetime__date=date_param)

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        if start_date and end_date:
            queryset = queryset.filter(
                scheduled_datetime__date__gte=start_date,
                scheduled_datetime__date__lte=end_date,
            )
        elif start_date:
            queryset = queryset.filter(scheduled_datetime__date__gte=start_date)
        elif end_date:
            queryset = queryset.filter(scheduled_datetime__date__lte=end_date)

        serializer = MedicationHistorySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
