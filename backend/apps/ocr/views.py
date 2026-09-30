"""OCR endpoints: upload, review, correct, confirm."""

from __future__ import annotations

import mimetypes

from django.http import FileResponse, Http404
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsProfileOwnerOrAssignedCaregiver
from apps.medications.serializers import MedicineSerializer
from apps.prescriptions.serializers import PrescriptionSerializer

from .models import ExtractedMedicine, ItemStatus, JobSource, JobStatus, OCRJob
from .serializers import (
    ConfirmSerializer,
    ExtractedMedicineSerializer,
    ExtractedMedicineUpdateSerializer,
    OCRJobCreateSerializer,
    OCRJobSerializer,
    ParseTextSerializer,
    ReparseSerializer,
)
from .services import pipeline


def _run(job: OCRJob) -> OCRJob:
    """Process now, or hand to a worker when OCR_ASYNC is on.

    Inline is the default because a scan takes a few seconds and a single
    deployment without a Celery worker must still work. With a worker, the
    request returns immediately with status QUEUED and the client polls.
    """
    from django.conf import settings

    if getattr(settings, "OCR_ASYNC", False):
        from .tasks import process_ocr_job

        process_ocr_job.delay(str(job.pk))
        return job
    return pipeline.process_job(job)


@extend_schema(tags=["ocr"])
class OCRJobViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = OCRJob.objects.none()
    serializer_class = OCRJobSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrAssignedCaregiver]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["patient", "status", "kind"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        return (
            OCRJob.objects.filter(patient__in=self.request.user.accessible_patient_profiles())
            .select_related("patient", "prescription")
            .prefetch_related("items__reference")
        )

    @extend_schema(request=OCRJobCreateSerializer, responses={201: OCRJobSerializer})
    def create(self, request, *args, **kwargs):
        serializer = OCRJobCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        job = OCRJob.objects.create(
            patient=data["patient"],
            created_by=request.user,
            kind=data["kind"],
            source=JobSource.IMAGE,
            image=data["image"],
        )
        job = _run(job)
        return Response(
            OCRJobSerializer(job, context={"request": request}).data, status=status.HTTP_201_CREATED
        )

    @extend_schema(request=ParseTextSerializer, responses={201: OCRJobSerializer})
    @action(detail=False, methods=["post"], url_path="parse-text")
    def parse_text(self, request):
        """Extract medicines from typed or pasted text.

        The same review flow as an image, without the image. It covers the
        specification's "manually enter medicine details" path, and lets a
        patient whose photo would not read paste what they can see.
        """
        serializer = ParseTextSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        job = OCRJob.objects.create(
            patient=data["patient"],
            created_by=request.user,
            kind=data["kind"],
            source=JobSource.TEXT,
            raw_text=data["text"],
        )
        job = pipeline.process_job(job)
        return Response(
            OCRJobSerializer(job, context={"request": request}).data, status=status.HTTP_201_CREATED
        )

    @extend_schema(request=ReparseSerializer, responses={200: OCRJobSerializer})
    @action(detail=True, methods=["post"])
    def reparse(self, request, pk=None):
        """Re-extract from corrected text."""
        job = self.get_object()
        if job.status not in {JobStatus.COMPLETED, JobStatus.FAILED}:
            return Response(
                {"detail": "This scan can no longer be changed."}, status=status.HTTP_409_CONFLICT
            )
        serializer = ReparseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = pipeline.reparse(job, serializer.validated_data["text"])
        return Response(OCRJobSerializer(job, context={"request": request}).data)

    @extend_schema(request=ConfirmSerializer, responses={200: None})
    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        """Add the reviewed medicines to the patient's list."""
        job = self.get_object()
        serializer = ConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        stock = {
            str(entry["id"]): entry["quantity_remaining"]
            for entry in serializer.validated_data.get("items", [])
        }

        result = pipeline.confirm_job(job, stock=stock)
        job.refresh_from_db()
        return Response(
            {
                "job": OCRJobSerializer(job, context={"request": request}).data,
                "medicines": MedicineSerializer(
                    result["medicines"], many=True, context={"request": request}
                ).data,
                "prescription": (
                    PrescriptionSerializer(
                        result["prescription"], context={"request": request}
                    ).data
                    if result["prescription"]
                    else None
                ),
            }
        )

    @extend_schema(request=None, responses={200: OCRJobSerializer})
    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Discard a scan without adding anything."""
        job = self.get_object()
        if job.status == JobStatus.CONFIRMED:
            return Response(
                {"detail": "This has already been added, so it cannot be discarded."},
                status=status.HTTP_409_CONFLICT,
            )
        job.status = JobStatus.REJECTED
        job.save(update_fields=["status", "updated_at"])
        job.items.update(status=ItemStatus.REJECTED)
        return Response(OCRJobSerializer(job, context={"request": request}).data)

    @extend_schema(responses={200: None})
    @action(detail=True, methods=["get"])
    def image(self, request, pk=None):
        """The original photo, behind the same access check as everything else.

        A prescription image is a medical record. It is deliberately not served
        from a public media path: anyone who learned the URL could read it.
        """
        job = self.get_object()
        if not job.image:
            raise Http404("This scan has no image.")
        content_type = mimetypes.guess_type(job.image.name)[0] or "application/octet-stream"
        response = FileResponse(job.image.open("rb"), content_type=content_type)
        response["Cache-Control"] = "private, no-store"
        return response

    def perform_destroy(self, instance: OCRJob) -> None:
        # A confirmed scan's prescription may still point at this file.
        if instance.image and not instance.prescription_id:
            instance.image.delete(save=False)
        instance.delete()


@extend_schema(tags=["ocr"])
class ExtractedMedicineViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    """Correct one extracted medicine before confirming."""

    queryset = ExtractedMedicine.objects.none()
    serializer_class = ExtractedMedicineSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrAssignedCaregiver]
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return ExtractedMedicine.objects.filter(
            job__patient__in=self.request.user.accessible_patient_profiles()
        ).select_related("job", "job__patient", "reference")

    def get_serializer_class(self):
        if self.action in {"partial_update", "update"}:
            return ExtractedMedicineUpdateSerializer
        return ExtractedMedicineSerializer

    def partial_update(self, request, *args, **kwargs):
        item = self.get_object()
        if item.job.status != JobStatus.COMPLETED:
            return Response(
                {"detail": "This scan can no longer be edited."}, status=status.HTTP_409_CONFLICT
            )
        return super().partial_update(request, *args, **kwargs)
