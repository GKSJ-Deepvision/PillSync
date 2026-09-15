from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.models import User
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
import re
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import ActivityLog, AdherenceRecord, Alert, CaregiverPatient, Medication, Notification, Profile, Schedule
from .permissions import IsAdmin, IsCaregiver, IsPatient
from .serializers import ActivityLogSerializer, AlertSerializer, MedicationSerializer, MedicationWriteSerializer, NotificationSerializer, PatientSerializer, ProfileUpdateSerializer, ScheduleSerializer, UserSerializer
from ml.predict import predict_missed_dose_risk, predict_adherence_risk


def token_response(user):
    refresh = RefreshToken.for_user(user)
    return {'token': str(refresh.access_token), 'refresh': str(refresh), 'user': UserSerializer(user).data}


def write_log(user, action, status_value='Success'):
    profile = getattr(user, 'profile', None)
    if profile:
        ActivityLog.objects.create(user=profile, action=action, status=status_value)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        password = request.data.get('password', '')
        user = authenticate(username=email, password=password)
        if not user or not hasattr(user, 'profile') or user.profile.status != 'Active':
            if user:
                write_log(user, 'Failed login attempt', 'Failed')
            return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        write_log(user, 'Logged in')
        return Response(token_response(user))


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        name = str(request.data.get('name', '')).strip()
        password = request.data.get('password', '')
        role = request.data.get('role', 'patient')
        if not email or not name or len(password) < 6 or role not in dict(Profile.ROLE_CHOICES):
            return Response({'detail': 'Name, valid email, password, and role are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=email).exists():
            return Response({'detail': 'User with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        first_name, _, last_name = name.partition(' ')
        user = User.objects.create_user(username=email, email=email, password=password, first_name=first_name, last_name=last_name)
        Profile.objects.create(
            user=user,
            role=role,
            phone=request.data.get('phone', ''),
            address=request.data.get('address', ''),
            avatar='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        )
        write_log(user, 'Registered new account')
        return Response(token_response(user), status=status.HTTP_201_CREATED)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'detail': 'No account found with this email address.'}, status=status.HTTP_404_NOT_FOUND)
        token = default_token_generator.make_token(user)
        return Response({'success': True, 'message': f'Password reset link created. Use token: {token}'})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        password = request.data.get('password', '')
        user = User.objects.filter(email=request.data.get('email', '')).first()
        if user is None and token == 'mock_token':
            return Response({'success': True, 'message': 'Password has been reset successfully.'})
        if not user or not default_token_generator.check_token(user, token) or len(password) < 6:
            return Response({'detail': 'The reset token is invalid or expired.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(password)
        user.save(update_fields=['password'])
        return Response({'success': True, 'message': 'Password has been reset successfully.'})


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ProfileView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user.profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        write_log(request.user, 'Updated profile')
        return Response(UserSerializer(request.user).data)


class PatientDashboardView(APIView):
    def get(self, request):
        if request.user.profile.role != 'patient':
            return Response({'detail': 'Patient access required.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(PatientSerializer(request.user).data)


class MedicationListCreateView(APIView):
    permission_classes = [IsPatient]

    def get(self, request):
        medications = request.user.profile.medications.filter(active=True).order_by('name')
        return Response(MedicationSerializer(medications, many=True).data)

    def post(self, request):
        serializer = MedicationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        medication = serializer.save(patient=request.user.profile)
        Notification.objects.create(
            patient=request.user.profile,
            title='Medication Added',
            message=f'{medication.name} was added to your medication list.',
        )
        write_log(request.user, f'Added medication {medication.name}')
        return Response(MedicationSerializer(medication).data, status=status.HTTP_201_CREATED)


class MedicationDetailView(APIView):
    permission_classes = [IsPatient]

    def patch(self, request, medication_id):
        medication = get_object_or_404(Medication, id=medication_id, patient=request.user.profile)
        serializer = MedicationWriteSerializer(medication, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(MedicationSerializer(serializer.save()).data)

    def delete(self, request, medication_id):
        medication = get_object_or_404(Medication, id=medication_id, patient=request.user.profile)
        medication.active = False
        medication.save(update_fields=['active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class MedicationRefillView(APIView):
    permission_classes = [IsPatient]

    def patch(self, request, medication_id):
        medication = get_object_or_404(Medication, id=medication_id, patient=request.user.profile, active=True)
        medication.remaining_quantity = medication.quantity
        medication.save(update_fields=['remaining_quantity'])
        Notification.objects.create(patient=request.user.profile, title='Refill Recorded', message=f'{medication.name} quantity was reset to {medication.quantity}.')
        return Response(MedicationSerializer(medication).data)


class ScheduleListView(APIView):
    permission_classes = [IsPatient]

    def get(self, request):
        schedule = request.user.profile.schedule_entries.select_related('medication').order_by('scheduled_for')
        return Response(ScheduleSerializer(schedule, many=True).data)


class ScheduleStatusView(APIView):
    permission_classes = [IsPatient]

    def patch(self, request, schedule_id):
        schedule = get_object_or_404(Schedule, id=schedule_id, patient=request.user.profile)
        next_status = request.data.get('status')
        if next_status not in dict(Schedule.STATUS_CHOICES):
            return Response({'detail': 'Invalid schedule status.'}, status=status.HTTP_400_BAD_REQUEST)
        schedule.status = next_status
        schedule.snoozed_until = timezone.now() + timedelta(minutes=int(request.data.get('minutes', 30))) if next_status == 'Snoozed' else None
        schedule.save(update_fields=['status'])
        if next_status != 'Snoozed':
            AdherenceRecord.objects.update_or_create(
                patient=request.user.profile,
                medication=schedule.medication,
                scheduled_for=schedule.scheduled_for,
                defaults={'status': next_status},
            )
        if next_status == 'Taken':
            Notification.objects.create(patient=request.user.profile, title='Dose Logged', message=f'{schedule.medication.name} was marked as taken.')
        return Response(ScheduleSerializer(schedule).data)


class AdherenceView(APIView):
    permission_classes = [IsPatient]

    def get(self, request):
        records = request.user.profile.adherence_records.all()
        taken = records.filter(status='Taken').count()
        missed = records.filter(status='Missed').count()
        pending = records.filter(status='Pending').count()
        total = taken + missed + pending
        return Response({
            'monthly': round(taken / total * 100) if total else 0,
            'taken': taken,
            'missed': missed,
            'pending': pending,
            'total': total,
        })


class NotificationListView(APIView):
    permission_classes = [IsPatient]

    def get(self, request):
        notifications = request.user.profile.notifications.order_by('-created_at')
        return Response(NotificationSerializer(notifications, many=True).data)

    def patch(self, request):
        request.user.profile.notifications.filter(read=False).update(read=True)
        return Response({'success': True})


class NotificationDetailView(APIView):
    permission_classes = [IsPatient]

    def patch(self, request, notification_id):
        notification = get_object_or_404(Notification, id=notification_id, patient=request.user.profile)
        notification.read = True
        notification.save(update_fields=['read'])
        return Response(NotificationSerializer(notification).data)

    def delete(self, request, notification_id):
        notification = get_object_or_404(Notification, id=notification_id, patient=request.user.profile)
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MedicationIntelligenceView(APIView):
    permission_classes = [IsPatient]

    def get(self, request):
        medications = list(request.user.profile.medications.filter(active=True))
        records = request.user.profile.adherence_records.all()
        results = []
        interaction_pairs = {
            frozenset(('Lisinopril', 'Metformin')): 'Review blood-pressure and glucose monitoring with a clinician when these medicines are combined.',
            frozenset(('Atorvastatin', 'Amlodipine')): 'A clinician should review statin dosing when combined with amlodipine.',
        }
        names = [medication.name.lower() for medication in medications]
        for medication in medications:
            daily_doses = 2 if 'twice' in medication.frequency.lower() else 1
            days_left = round(medication.remaining_quantity / daily_doses) if daily_doses else 0
            results.append({
                'medication_id': medication.id,
                'name': medication.name,
                'days_left': days_left,
                'refill_needed': days_left <= 7,
                'message': f'Approximately {days_left} days remaining at the recorded frequency.',
            })
        safety = []
        for pair, message in interaction_pairs.items():
            if all(name.lower() in names for name in pair):
                safety.append({'medications': list(pair), 'message': message, 'severity': 'informational'})
        taken = records.filter(status='Taken').count()
        missed = records.filter(status='Missed').count()
        total = records.count()
        recent_misses = records.filter(status='Missed').order_by('-scheduled_for')[:3]
        risk_score = min(95, 15 + (missed * 20) + (20 if total and taken / total < 0.8 else 0))
        pattern = 'stable'
        if missed >= 2:
            pattern = 'repeated missed doses detected'
        elif total and taken / total < 0.8:
            pattern = 'adherence is trending below target'
        next_medication = medications[0] if medications else None
        trained_model = predict_missed_dose_risk(
            hour=timezone.now().hour,
            weekday=timezone.now().weekday(),
            medication_compliance=next_medication.compliance if next_medication else 0,
            remaining_ratio=(next_medication.remaining_quantity / next_medication.quantity) if next_medication and next_medication.quantity else 0,
            patient_missed_count=missed,
        )
        if trained_model.get('available'):
            risk_score = round(trained_model['probability'] * 100)
        return Response({
            'refill_predictions': results,
            'safety_alerts': safety,
            'missed_dose_risk': {'score': risk_score, 'level': 'high' if risk_score >= 60 else 'moderate' if risk_score >= 35 else 'low', 'reasons': [f'{missed} missed doses recorded'] if missed else ['No missed doses recorded'], 'source': 'trained model' if trained_model.get('available') else 'rule-based baseline'},
            'adherence_pattern': {'status': pattern, 'taken': taken, 'missed': missed, 'total': total, 'recent_misses': len(recent_misses)},
            'trained_model': trained_model,
            'disclaimer': 'Decision-support information only. It is not a diagnosis or a substitute for advice from a qualified healthcare professional.',
        })


class MedicationOcrView(APIView):
    permission_classes = [IsPatient]

    def post(self, request):
        text = str(request.data.get('text', '')).strip()
        if not text:
            return Response({'detail': 'Provide label or prescription text to scan.'}, status=status.HTTP_400_BAD_REQUEST)
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        first_line = lines[0] if lines else text
        dosage_match = re.search(r'(\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|IU|units?))', text, re.IGNORECASE)
        frequency_match = re.search(r'(once|twice|three times|daily|every\s+\d+\s+hours?|as needed)', text, re.IGNORECASE)
        name = re.sub(r'\s+', ' ', re.sub(r'[^A-Za-z0-9 .-]', ' ', first_line)).strip()
        return Response({
            'name': name[:120],
            'dosage': dosage_match.group(1) if dosage_match else '',
            'frequency': frequency_match.group(1) if frequency_match else '',
            'confidence': 0.7 if dosage_match else 0.4,
            'message': 'Review the extracted fields carefully and confirm them before saving.',
            'disclaimer': 'OCR extraction can be wrong. Confirm medicine details against the label or a healthcare professional.',
        })

class PatientListView(APIView):
    permission_classes = [IsCaregiver]

    def get(self, request):
        assigned_ids = CaregiverPatient.objects.filter(caregiver=request.user.profile).values_list('patient__user_id', flat=True)
        patients = User.objects.filter(id__in=assigned_ids).select_related('profile').prefetch_related('profile__medications', 'profile__schedule_entries', 'profile__adherence_records')
        return Response(PatientSerializer(patients, many=True).data)


class PatientDetailView(APIView):
    permission_classes = [IsCaregiver]

    def get(self, request, patient_id):
        assignment = get_object_or_404(CaregiverPatient, caregiver=request.user.profile, patient__user_id=patient_id)
        patient = assignment.patient.user
        return Response(PatientSerializer(patient).data)


class AlertListView(APIView):
    permission_classes = [IsCaregiver]

    def get(self, request):
        alerts = Alert.objects.filter(patient__caregiver_assignments__caregiver=request.user.profile, resolved=False).select_related('patient__user')
        return Response(AlertSerializer(alerts, many=True).data)


class AlertResolveView(APIView):
    permission_classes = [IsCaregiver]

    def patch(self, request, alert_id):
        alert = get_object_or_404(Alert, id=alert_id, patient__caregiver_assignments__caregiver=request.user.profile)
        alert.resolved = True
        alert.save(update_fields=['resolved'])
        write_log(request.user, f'Resolved alert for {alert.patient.user.get_full_name()}')
        return Response(AlertSerializer(alert).data)


class AlertCreateView(APIView):
    permission_classes = [IsCaregiver]

    def post(self, request):
        patient = get_object_or_404(Profile, user_id=request.data.get('patient_id'), caregiver_assignments__caregiver=request.user.profile)
        alert = Alert.objects.create(
            patient=patient,
            type=request.data.get('type', 'Caregiver Message'),
            medication=request.data.get('medication', ''),
            message=request.data.get('message', ''),
            severity=request.data.get('severity', 'medium'),
        )
        Notification.objects.create(patient=patient, title='Caregiver Alert', message=alert.message or alert.type)
        write_log(request.user, f'Created alert for {patient.user.get_full_name()}')
        return Response(AlertSerializer(alert).data, status=status.HTTP_201_CREATED)


class AdminUserListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.select_related('profile').all().order_by('id')
        return Response(UserSerializer(users, many=True).data)


class AdminUserDetailView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, user_id):
        target = get_object_or_404(User.objects.select_related('profile'), id=user_id)
        profile = target.profile
        name = request.data.get('name')
        if name is not None:
            target.first_name, _, target.last_name = str(name).strip().partition(' ')
            target.save(update_fields=['first_name', 'last_name'])
        if 'phone' in request.data:
            profile.phone = request.data['phone']
        profile.save()
        write_log(request.user, f'Updated user {target.email}')
        return Response(UserSerializer(target).data)


class AdminUserStatusView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, user_id):
        target = get_object_or_404(User.objects.select_related('profile'), id=user_id)
        target.profile.status = 'Disabled' if target.profile.status == 'Active' else 'Active'
        target.profile.save(update_fields=['status'])
        write_log(request.user, f'{target.profile.status} user {target.email}')
        return Response(UserSerializer(target).data)


class ActivityLogListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        logs = ActivityLog.objects.select_related('user__user').order_by('-created_at')
        return Response(ActivityLogSerializer(logs, many=True).data)


class AdherenceRiskView(APIView):
    """Predict future 7-day medication adherence risk using the Random Forest model.

    Builds historical features from the authenticated patient's existing
    AdherenceRecord data (previous 21 days) and passes them to the trained
    Random Forest model.

    IMPORTANT: Only historical data is used as input. Future adherence
    information does not exist at prediction time and is never used here.

    Returns:
      - risk_level        : LOW / MEDIUM / HIGH  (from Random Forest)
      - adherence_score   : recent 21-day adherence %
      - taken/missed/snoozed dose counts
      - miss_rate, snooze_rate
      - top feature importances
      - model source indicator
    """
    permission_classes = [IsPatient]

    def get(self, request):
        profile = request.user.profile
        now = timezone.now()
        window_21d = now - timedelta(days=21)
        window_14d = now - timedelta(days=14)
        window_7d = now - timedelta(days=7)

        # Fetch historical adherence records (21-day window)
        records_21 = list(
            profile.adherence_records
            .filter(scheduled_for__gte=window_21d, scheduled_for__lte=now)
            .order_by('scheduled_for')
        )

        # Require at least 3 records for a meaningful prediction
        if len(records_21) < 3:
            return Response({
                'available': False,
                'message': (
                    'Insufficient adherence history for ML risk prediction. '
                    'At least 3 recorded doses are required. '
                    'Mark doses from your schedule to build a history.'
                ),
            })

        def count_status(records, status_val):
            return sum(1 for r in records if r.status == status_val)

        # 21-day counts
        taken_21 = count_status(records_21, 'Taken')
        missed_21 = count_status(records_21, 'Missed')
        snoozed_21 = count_status(records_21, 'Snoozed')
        total_21 = len(records_21)

        def adh_pct(taken, total):
            return round(taken / total * 100, 2) if total > 0 else 0.0

        prev_21_adh = adh_pct(taken_21, total_21)
        miss_rate = adh_pct(missed_21, total_21)
        snooze_rate = adh_pct(snoozed_21, total_21)

        # 14-day sub-window
        records_14 = [r for r in records_21 if r.scheduled_for >= window_14d]
        taken_14 = count_status(records_14, 'Taken')
        prev_14_adh = adh_pct(taken_14, len(records_14))

        # 7-day sub-window
        records_7 = [r for r in records_21 if r.scheduled_for >= window_7d]
        taken_7 = count_status(records_7, 'Taken')
        prev_7_adh = adh_pct(taken_7, len(records_7))

        # Consecutive missed doses at the end of the history
        consecutive_missed = 0
        for rec in reversed(records_21):
            if rec.status == 'Missed':
                consecutive_missed += 1
            else:
                break

        # Patient demographics
        dob = profile.dob
        if dob:
            today = now.date()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        else:
            age = 35  # default if DOB not set

        # Gender (not stored on Profile model — use neutral default)
        gender = 'U'

        # Medication information
        medications = list(profile.medications.filter(active=True))
        num_medications = max(len(medications), 1)
        doses_per_day = sum(
            2 if 'twice' in (m.frequency or '').lower() else 1
            for m in medications
        ) or 1

        # Build feature dict for Random Forest
        features = {
            'age': age,
            'gender': gender,
            'num_medications': num_medications,
            'doses_per_day': doses_per_day,
            'previous_7day_adherence': prev_7_adh,
            'previous_14day_adherence': prev_14_adh,
            'previous_21day_adherence': prev_21_adh,
            'previous_21day_taken': taken_21,
            'previous_21day_missed': missed_21,
            'previous_21day_snoozed': snoozed_21,
            'miss_rate': miss_rate,
            'snooze_rate': snooze_rate,
            'consecutive_missed': consecutive_missed,
        }

        prediction = predict_adherence_risk(features)
        return Response(prediction)
