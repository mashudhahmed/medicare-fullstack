from django.db import models
from django.utils import timezone
import uuid
from .user import User


class AuditLog(models.Model):
    class Action(models.TextChoices):
        LOGIN = 'login', 'Login'
        LOGOUT = 'logout', 'Logout'
        CREATE = 'create', 'Create'
        UPDATE = 'update', 'Update'
        DELETE = 'delete', 'Delete'
        VIEW = 'view', 'View'
        VERIFY = 'verify', 'Verify Doctor'
        PAYMENT = 'payment', 'Payment'
        SECURITY = 'security', 'Security Alert'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=50, choices=Action.choices, db_index=True)
    resource_type = models.CharField(max_length=100, db_index=True)
    resource_id = models.CharField(max_length=100, blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True, null=True)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'action']),
            models.Index(fields=['resource_type', 'resource_id']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        user_email = self.user.email if self.user else "Anonymous"
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.action} on {self.resource_type} by {user_email}"
