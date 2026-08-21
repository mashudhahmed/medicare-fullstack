from django.db import models
from django.utils import timezone
import uuid
from .user import User
from .managers import SoftDeleteManager


class Patient(models.Model):
    class Gender(models.TextChoices):
        MALE = 'male', 'Male'
        FEMALE = 'female', 'Female'
        OTHER = 'other', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')

    date_of_birth = models.DateField(default='2000-01-01')
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.OTHER)
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    emergency_contact = models.CharField(max_length=20, blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    chronic_conditions = models.TextField(blank=True, null=True)

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Soft Delete Manager
    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        db_table = 'patients'
        indexes = [
            models.Index(fields=['user', 'is_deleted']),
            models.Index(fields=['blood_group']),
        ]

    def __str__(self):
        return f"Patient: {self.user.full_name}"

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()