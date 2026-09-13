"""
Simple health / readiness endpoints for load balancers and orchestrators.
Add to urls.py:

    from apps.api.views.health_views import HealthCheckView, ReadyCheckView
    path('health/', HealthCheckView.as_view(), name='health'),
    path('ready/', ReadyCheckView.as_view(), name='ready'),
"""
from django.db import connection
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions


class HealthCheckView(APIView):
    """Liveness – process is up."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class ReadyCheckView(APIView):
    """Readiness – DB and cache are reachable."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        checks = {}
        overall = True

        # Database
        try:
            connection.ensure_connection()
            checks["database"] = "ok"
        except Exception as e:
            checks["database"] = str(e)
            overall = False

        # Cache / Redis
        try:
            cache.set("healthcheck", "1", 5)
            if cache.get("healthcheck") == "1":
                checks["cache"] = "ok"
            else:
                checks["cache"] = "read-back failed"
                overall = False
        except Exception as e:
            checks["cache"] = str(e)
            overall = False

        code = status.HTTP_200_OK if overall else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response({"status": "ok" if overall else "degraded", "checks": checks}, status=code)
