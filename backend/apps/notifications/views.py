from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DeviceToken
from .serializers import DeviceTokenSerializer


class DeviceTokenView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=DeviceTokenSerializer,
        responses=DeviceTokenSerializer,
    )
    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response(
                {"error": "token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        device, created = DeviceToken.objects.update_or_create(
            token=token,
            defaults={
                "user": request.user,
                "device_type": request.data.get("device_type", ""),
                "is_active": True,
            },
        )

        return Response(
            DeviceTokenSerializer(device).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        token = request.data.get("token")

        DeviceToken.objects.filter(
            user=request.user,
            token=token,
        ).update(is_active=False)

        return Response(status=status.HTTP_204_NO_CONTENT)
