from django.db import IntegrityError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CaregiverPatientRelationship, User
from .permissions import IsAdminRole
from .serializers import CaregiverPatientRelationshipSerializer, RelationshipCreateSerializer


class CaregiverPatientRelationshipListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != User.Role.CAREGIVER:
            return Response(
                {"detail": "Only caregivers can list their patient relationships."},
                status=status.HTTP_403_FORBIDDEN,
            )
        relationships = CaregiverPatientRelationship.objects.filter(
            caregiver=request.user
        ).select_related("caregiver", "patient")
        return Response(CaregiverPatientRelationshipSerializer(relationships, many=True).data)

    def post(self, request):
        if not IsAdminRole().has_permission(request, self):
            return Response(
                {"detail": IsAdminRole.message},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = RelationshipCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            relationship = serializer.save()
        except IntegrityError:
            return Response(
                {"detail": "This caregiver-patient relationship already exists."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(
            CaregiverPatientRelationshipSerializer(relationship).data,
            status=status.HTTP_201_CREATED,
        )


class CaregiverPatientRelationshipDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, relationship_id):
        queryset = CaregiverPatientRelationship.objects.select_related("caregiver", "patient")
        if request.user.role == User.Role.ADMIN:
            return queryset.filter(id=relationship_id).first()
        if request.user.role == User.Role.CAREGIVER:
            return queryset.filter(
                id=relationship_id,
                caregiver=request.user,
            ).first()
        return None

    def get(self, request, relationship_id):
        relationship = self.get_object(request, relationship_id)
        if relationship is None:
            return Response(
                {"detail": "Relationship not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(CaregiverPatientRelationshipSerializer(relationship).data)

    def delete(self, request, relationship_id):
        relationship = self.get_object(request, relationship_id)
        if relationship is None:
            return Response(
                {"detail": "Relationship not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        relationship.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
