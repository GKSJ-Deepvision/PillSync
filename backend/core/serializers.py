from django.contrib.auth.models import User
from rest_framework import serializers

from .models import ActivityLog, Alert, AdherenceRecord, Medication, Notification, Profile, Schedule


class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='get_full_name')
    email = serializers.EmailField(read_only=True)
    phone = serializers.CharField(source='profile.phone', read_only=True)
    role = serializers.CharField(source='profile.role', read_only=True)
    dob = serializers.DateField(source='profile.dob', read_only=True, allow_null=True)
    address = serializers.CharField(source='profile.address', read_only=True)
    status = serializers.CharField(source='profile.status', read_only=True)
    avatar = serializers.URLField(source='profile.avatar', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'phone', 'role', 'dob', 'address', 'status', 'avatar']


class ProfileUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.get_full_name', required=False)
    phone = serializers.CharField(required=False, allow_blank=True)
    dob = serializers.DateField(required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Profile
        fields = ['name', 'phone', 'dob', 'address']

    def update(self, instance, validated_data):
        name = validated_data.pop('user', {}).pop('get_full_name', None)
        if name is not None:
            instance.user.first_name, _, instance.user.last_name = name.strip().partition(' ')
            instance.user.save(update_fields=['first_name', 'last_name'])
        return super().update(instance, validated_data)


class MedicationSerializer(serializers.ModelSerializer):
    time = serializers.CharField(source='scheduled_time')

    class Meta:
        model = Medication
        fields = ['id', 'name', 'dosage', 'frequency', 'time', 'compliance', 'quantity', 'remaining_quantity', 'active']


class MedicationWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = ['name', 'dosage', 'frequency', 'scheduled_time', 'quantity', 'remaining_quantity', 'active']


class ScheduleSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='medication.name')
    dosage = serializers.CharField(source='medication.dosage')
    time = serializers.SerializerMethodField()

    class Meta:
        model = Schedule
        fields = ['id', 'time', 'name', 'dosage', 'status', 'snoozed_until']

    def get_time(self, obj):
        return obj.scheduled_for.strftime('%I:%M %p')


class PatientSerializer(UserSerializer):
    age = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    medications = MedicationSerializer(source='profile.medications', many=True, read_only=True)
    schedule = ScheduleSerializer(source='profile.schedule_entries', many=True, read_only=True)
    adherence = serializers.SerializerMethodField()
    lastActivity = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['age', 'medications', 'schedule', 'adherence', 'lastActivity']

    def get_age(self, obj):
        if not obj.profile.dob:
            return None
        from datetime import date
        today = date.today()
        return today.year - obj.profile.dob.year - ((today.month, today.day) < (obj.profile.dob.month, obj.profile.dob.day))

    def get_status(self, obj):
        adherence = self.get_adherence(obj)['monthly']
        return 'Needs Attention' if adherence and adherence < 80 else 'On Track'

    def get_adherence(self, obj):
        records = obj.profile.adherence_records.all()
        total = records.count()
        taken = records.filter(status='Taken').count()
        return {'weekly': [], 'monthly': round((taken / total) * 100) if total else 0}

    def get_lastActivity(self, obj):
        latest = obj.profile.adherence_records.order_by('-recorded_at').first()
        if not latest:
            return 'No medication activity recorded'
        return f'{latest.status} {latest.medication.name if latest.medication else "dose"}'


class AlertSerializer(serializers.ModelSerializer):
    patientId = serializers.IntegerField(source='patient.user_id', read_only=True)
    patientName = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    time = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Alert
        fields = ['id', 'patientId', 'patientName', 'type', 'medication', 'message', 'time', 'severity', 'resolved']


class ActivityLogSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.user.get_full_name', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    time = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'role', 'action', 'time', 'status']


class NotificationSerializer(serializers.ModelSerializer):
    time = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'time', 'read']
