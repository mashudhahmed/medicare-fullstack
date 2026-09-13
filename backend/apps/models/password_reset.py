from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid
from .user import User
from apps.core.security import generate_verification_code


class PasswordResetCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_codes')
    code = models.CharField(max_length=6, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = 'password_reset_codes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'code', 'is_used']),
        ]

    def __str__(self):
        return f"Reset code for {self.user.email} (expires {self.expires_at})"

    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at

    @classmethod
    def create_for_user(cls, user, expiry_minutes=15):
        # Invalidate existing unused codes for this user
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        code = generate_verification_code(6)
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        return cls.objects.create(user=user, code=code, expires_at=expires_at)
