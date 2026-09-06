from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.schemas import HealthResponseSerializer


@extend_schema(
    tags=["Health"],
    responses={200: HealthResponseSerializer},
    summary="Health check",
    description="Checks whether the PillSync backend is running.",
)
class HealthView(APIView):
    def get(self, request):
        return Response({"status": "ok"})
