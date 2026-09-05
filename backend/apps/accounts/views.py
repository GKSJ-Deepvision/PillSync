"""Authentication, user and caregiver-assignment endpoints."""

from __future__ import annotations

import logging

from django.contrib.auth import get_user_model
from django.db.models import Q
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.common.choices import AssignmentStatus, UserRole
from apps.common.permissions import IsAdmin

from .models import CaregiverAssignment
from .serializers import (
    AdminUserSerializer,
    CaregiverAssignmentSerializer,
    CaregiverInviteSerializer,
    GoogleAuthSerializer,
    LogoutSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .services import (
    client_ip,
    get_or_create_google_user,
    issue_tokens,
    send_password_reset_email,
    verify_google_id_token,
)

logger = logging.getLogger(__name__)
User = get_user_model()


@extend_schema(tags=["auth"])
class RegisterView(generics.CreateAPIView):
    """Create a patient or caregiver account and sign straight in."""

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_scope = "register"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        logger.info("Registered %s as %s", user.email, user.role)
        return Response(
            {"user": UserSerializer(user).data, "tokens": issue_tokens(user)},
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["auth"])
class LoginView(TokenObtainPairView):
    """Email and password login. Returns an access/refresh pair plus the user."""

    permission_classes = [AllowAny]
    throttle_scope = "login"

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            email = str(request.data.get("email", "")).lower().strip()
            User.objects.filter(email=email).update(last_login_ip=client_ip(request))
        return response


@extend_schema(tags=["auth"])
class GoogleLoginView(APIView):
    """Exchange a verified Google ID token for PillSync tokens."""

    permission_classes = [AllowAny]
    serializer_class = GoogleAuthSerializer
    throttle_scope = "login"

    @extend_schema(
        request=GoogleAuthSerializer,
        responses={200: OpenApiResponse(description="Tokens and the signed-in user")},
    )
    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        claims = verify_google_id_token(serializer.validated_data["id_token"])
        user, created = get_or_create_google_user(
            claims, serializer.validated_data.get("role", UserRole.PATIENT)
        )
        if not user.is_active:
            return Response(
                {"detail": "This account has been deactivated."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.last_login_ip = client_ip(request)
        user.save(update_fields=["last_login_ip", "updated_at"])

        return Response(
            {"user": UserSerializer(user).data, "tokens": issue_tokens(user), "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


@extend_schema(tags=["auth"])
class LogoutView(APIView):
    """Blacklist a refresh token so it cannot be used again.

    The access token stays valid until it expires - that is how stateless JWTs
    work. Keeping the access lifetime short (30 minutes by default) is what
    bounds the window.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer

    @extend_schema(request=LogoutSerializer, responses={205: None})
    def post(self, request):
        raw = request.data.get("refresh")
        if not raw:
            return Response(
                {"detail": "A refresh token is required to log out."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(raw).blacklist()
        except TokenError:
            return Response(
                {"detail": "That refresh token is already invalid."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


@extend_schema(tags=["users"])
class MeView(generics.RetrieveUpdateAPIView):
    """Read or update the signed-in user's own account."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


@extend_schema(tags=["auth"])
class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PasswordChangeSerializer

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Your password has been changed."})


@extend_schema(tags=["auth"])
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.get_user()
        if user is not None:
            uid, token = serializer.build_token(user)
            send_password_reset_email(user, uid, token)

        # The same response either way. Confirming whether an address is
        # registered would turn this endpoint into an account-enumeration tool.
        return Response({"detail": "If that email is registered, a reset link is on its way."})


@extend_schema(tags=["auth"])
class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Your password has been reset. You can sign in now."})


@extend_schema(tags=["caregiving"])
class CaregiverAssignmentViewSet(viewsets.ModelViewSet):
    """Caregiver-to-patient links.

    Patients see and manage the caregivers who can see them; caregivers see the
    patients who have granted them access. An assignment is created PENDING and
    only the patient can activate it.
    """

    queryset = CaregiverAssignment.objects.none()
    serializer_class = CaregiverAssignmentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        base = CaregiverAssignment.objects.select_related("caregiver", "patient")
        if user.is_admin:
            return base
        return base.filter(Q(patient=user) | Q(caregiver=user))

    def get_serializer_class(self):
        if self.action == "create":
            return CaregiverInviteSerializer
        return CaregiverAssignmentSerializer

    def create(self, request, *args, **kwargs):
        if request.user.role != UserRole.PATIENT and not request.user.is_admin:
            return Response(
                {"detail": "Only a patient can invite a caregiver."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save()
        return Response(
            CaregiverAssignmentSerializer(assignment).data, status=status.HTTP_201_CREATED
        )

    @extend_schema(request=None, responses={200: CaregiverAssignmentSerializer})
    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        """The patient grants the caregiver access."""
        assignment = self.get_object()
        if assignment.patient_id != request.user.id and not request.user.is_admin:
            return Response(
                {"detail": "Only the patient can accept this request."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if assignment.status != AssignmentStatus.PENDING:
            return Response(
                {"detail": f"This request is already {assignment.get_status_display().lower()}."},
                status=status.HTTP_409_CONFLICT,
            )
        assignment.activate()
        return Response(CaregiverAssignmentSerializer(assignment).data)

    @extend_schema(request=None, responses={200: CaregiverAssignmentSerializer})
    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        assignment = self.get_object()
        if assignment.patient_id != request.user.id and not request.user.is_admin:
            return Response(
                {"detail": "Only the patient can decline this request."},
                status=status.HTTP_403_FORBIDDEN,
            )
        assignment.decline()
        return Response(CaregiverAssignmentSerializer(assignment).data)

    @extend_schema(request=None, responses={200: CaregiverAssignmentSerializer})
    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        """Either side can end an active assignment."""
        assignment = self.get_object()
        if request.user.id not in {assignment.patient_id, assignment.caregiver_id} and not (
            request.user.is_admin
        ):
            return Response(
                {"detail": "You are not part of this assignment."},
                status=status.HTTP_403_FORBIDDEN,
            )
        assignment.revoke()
        return Response(CaregiverAssignmentSerializer(assignment).data)


@extend_schema(tags=["users"])
class AdminUserViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Administrator user management.

    Built from explicit mixins rather than ModelViewSet so that POST reaches the
    activate/deactivate actions only - there is no create route here, because a
    user is created through registration, and no destroy route, because
    medication history must outlive the account.
    """

    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ["role", "is_active", "is_email_verified"]
    search_fields = ["email", "full_name"]
    ordering_fields = ["date_joined", "email", "full_name"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    @extend_schema(request=None, responses={200: AdminUserSerializer})
    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        """Deactivate rather than delete: medication history has to survive."""
        user = self.get_object()
        if user == request.user:
            return Response(
                {"detail": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_active = False
        user.save(update_fields=["is_active", "updated_at"])
        return Response(AdminUserSerializer(user).data)

    @extend_schema(request=None, responses={200: AdminUserSerializer})
    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=["is_active", "updated_at"])
        return Response(AdminUserSerializer(user).data)
