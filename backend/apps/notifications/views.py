from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DeviceToken


class DeviceTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response(
                {"detail": "token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        device_token, created = DeviceToken.objects.update_or_create(
            token=token,
            defaults={
                "user": request.user,
                "is_active": True,
            },
        )

        return Response(
            {
                "id": device_token.id,
                "token": device_token.token,
                "is_active": device_token.is_active,
                "message": (
                    "Device token registered successfully."
                    if created
                    else "Device token updated successfully."
                ),
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )