from rest_framework import generics, permissions
from apps.models.audit_log import AuditLog
from apps.schemas.audit_log_schema import AuditLogSerializer
from apps.core.permissions import IsAdmin


class ListAuditLogsView(generics.ListAPIView):
    """List system audit logs (Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        queryset = AuditLog.objects.select_related('user').all()
        action = self.request.query_params.get('action')
        resource_type = self.request.query_params.get('resource_type')
        user_id = self.request.query_params.get('user_id')

        if action:
            queryset = queryset.filter(action=action)
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        return queryset
