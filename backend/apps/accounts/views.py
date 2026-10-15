from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CaregiverPatientAssignment
from .serializers import AssignmentSerializer, RegisterSerializer, UserSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        if User.objects.filter(email=request.data.get("email")).exists():
            return Response(
                {"email": ["A user with this email already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh), "user": user_data},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email = (request.data.get("email") or "").strip()
    password = request.data.get("password")
    requested_role = request.data.get("role")

    if not email or not password:
        return Response(
            {"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=email, password=password)
    if not user:
        # Case-insensitive fallback query by email or username
        try:
            u = (
                User.objects.filter(email__iexact=email).first()
                or User.objects.filter(username__iexact=email).first()
            )
            if u and u.check_password(password):
                user = u
        except Exception:
            pass

    if not user:
        return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

    if requested_role:
        user._role = requested_role.lower()

    refresh = RefreshToken.for_user(user)
    user_data = UserSerializer(user).data

    return Response(
        {"access": str(refresh.access_token), "refresh": str(refresh), "user": user_data}
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def profile_view(request):
    if request.user.is_authenticated:
        return Response(UserSerializer(request.user).data)
    # Default fallback demo user profile for unauthenticated dev view
    demo_user = User.objects.first()
    if demo_user:
        return Response(UserSerializer(demo_user).data)
    return Response(
        {
            "id": 1,
            "username": "patient@pillsync.com",
            "email": "patient@pillsync.com",
            "name": "Sarah Jenkins",
            "role": "patient",
        }
    )


# ── Caregiver–Patient Assignment Views ────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def list_users_view(request):
    """
    List all registered users with their roles.
    Used by the frontend to populate patient/caregiver dropdowns.
    """
    role_filter = request.query_params.get("role", "")
    users = User.objects.all().order_by("first_name", "last_name", "username")

    user_list = []
    for u in users:
        serialized = UserSerializer(u).data
        if role_filter and serialized.get("role") != role_filter:
            continue
        user_list.append(serialized)

    return Response(user_list)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def caregiver_assignments_view(request):
    """
    GET:  Return all caregiver-patient assignments (optionally filtered by
          ?caregiver_id=<id> or ?patient_id=<id>).
    POST: Create a new assignment { caregiver_id, patient_id }.
    """
    if request.method == "GET":
        qs = CaregiverPatientAssignment.objects.select_related("caregiver", "patient").all()
        caregiver_id = request.query_params.get("caregiver_id")
        patient_id = request.query_params.get("patient_id")

        if caregiver_id:
            qs = qs.filter(caregiver_id=caregiver_id)
        if patient_id:
            qs = qs.filter(patient_id=patient_id)

        # If authenticated as a caregiver, auto-filter to their assignments
        user = request.user
        if user and user.is_authenticated:
            from apps.medications.views import _get_user_role
            role = _get_user_role(user)
            if role == "caregiver" and not caregiver_id:
                qs = qs.filter(caregiver=user)
            elif role == "patient" and not patient_id:
                qs = qs.filter(patient=user)

        serializer = AssignmentSerializer(qs, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        caregiver_id = request.data.get("caregiver_id")
        patient_id = request.data.get("patient_id")
        note = request.data.get("note", "")

        if not caregiver_id or not patient_id:
            return Response(
                {"detail": "Both caregiver_id and patient_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            caregiver = User.objects.get(pk=caregiver_id)
            patient = User.objects.get(pk=patient_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Caregiver or patient user not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        assignment, created = CaregiverPatientAssignment.objects.get_or_create(
            caregiver=caregiver,
            patient=patient,
            defaults={"note": note},
        )

        if not created:
            return Response(
                {"detail": "This caregiver-patient assignment already exists."},
                status=status.HTTP_200_OK,
            )

        serializer = AssignmentSerializer(assignment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([AllowAny])
def caregiver_assignment_detail_view(request, pk):
    """
    DELETE a specific caregiver-patient assignment.
    """
    try:
        assignment = CaregiverPatientAssignment.objects.get(pk=pk)
    except CaregiverPatientAssignment.DoesNotExist:
        return Response(
            {"detail": "Assignment not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    assignment.delete()
    return Response({"status": "assignment removed"}, status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([AllowAny])
def caregiver_patients_view(request, caregiver_id):
    """
    GET the list of patients assigned to a specific caregiver.
    """
    assignments = CaregiverPatientAssignment.objects.filter(
        caregiver_id=caregiver_id
    ).select_related("patient")

    patients = []
    for a in assignments:
        u = a.patient
        serialized = UserSerializer(u).data
        serialized["assignment_id"] = a.id
        serialized["assigned_at"] = a.assigned_at.isoformat()
        serialized["note"] = a.note
        patients.append(serialized)

    return Response(patients)


@api_view(["GET"])
@permission_classes([AllowAny])
def patient_caregivers_view(request, patient_id):
    """
    GET the list of caregivers assigned to a specific patient.
    """
    assignments = CaregiverPatientAssignment.objects.filter(
        patient_id=patient_id
    ).select_related("caregiver")

    caregivers = []
    for a in assignments:
        u = a.caregiver
        serialized = UserSerializer(u).data
        serialized["assignment_id"] = a.id
        serialized["assigned_at"] = a.assigned_at.isoformat()
        serialized["note"] = a.note
        caregivers.append(serialized)

    return Response(caregivers)
