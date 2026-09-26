from rest_framework import viewsets

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = Notification.objects.all()
        profile_id = self.request.query_params.get("profile_id")
        if profile_id:
            qs = qs.filter(patient_profile_id=profile_id)
        return qs
