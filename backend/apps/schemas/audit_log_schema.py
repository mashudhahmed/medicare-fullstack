from rest_framework import serializers
from apps.models.audit_log import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'user',
            'user_email',
            'user_role',
            'action',
            'resource_type',
            'resource_id',
            'ip_address',
            'user_agent',
            'details',
            'timestamp',
        ]
        read_only_fields = fields
