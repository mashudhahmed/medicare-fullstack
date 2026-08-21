from django.db import models
from django.utils import timezone
import uuid
from .user import User
from .managers import SoftDeleteManager


class Doctor(models.Model):
    class Specialty(models.TextChoices):
        GENERAL = 'general', 'General Medicine'
        CARDIOLOGY = 'cardiology', 'Cardiology'
        DERMATOLOGY = 'dermatology', 'Dermatology'
        NEUROLOGY = 'neurology', 'Neurology'
        ORTHOPEDICS = 'orthopedics', 'Orthopedics'
        PEDIATRICS = 'pediatrics', 'Pediatrics'
        PSYCHIATRY = 'psychiatry', 'Psychiatry'
        SURGERY = 'surgery', 'Surgery'
        OBSTETRICS = 'obstetrics', 'Obstetrics & Gynecology'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')

    specialty = models.CharField(max_length=50, choices=Specialty.choices, default=Specialty.GENERAL)
    qualification = models.CharField(max_length=255, default='Pending')
    experience_years = models.IntegerField(default=0)
    license_number = models.CharField(max_length=50, unique=True, default='')
    is_verified = models.BooleanField(default=False)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    available_days = models.JSONField(default=list, blank=True)
    available_time_start = models.TimeField(null=True, blank=True)
    available_time_end = models.TimeField(null=True, blank=True)

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Soft Delete Manager
    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        db_table = 'doctors'
        indexes = [
            models.Index(fields=['user', 'is_deleted']),
            models.Index(fields=['specialty']),
            models.Index(fields=['is_verified']),
        ]

    def __str__(self):
        return f"Dr. {self.user.full_name} ({self.specialty})"

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()