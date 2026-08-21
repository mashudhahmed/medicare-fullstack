from django.db import models
from django.utils import timezone
import uuid
from .user import User
from .managers import SoftDeleteManager


class Notification(models.Model):
    class Type(models.TextChoices):
        APPOINTMENT = 'appointment', 'Appointment'
        BILLING = 'billing', 'Billing'
        SYSTEM = 'system', 'System'
        MEDICAL = 'medical', 'Medical Record'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=Type.choices, default=Type.SYSTEM)
    is_read = models.BooleanField(default=False, db_index=True)
    link = models.CharField(max_length=500, blank=True, null=True)

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'is_deleted']),
        ]

    def __str__(self):
        return f"{self.title} → {self.user.email}"

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()