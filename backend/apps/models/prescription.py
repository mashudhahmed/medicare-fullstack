from django.db import models
from django.utils import timezone
import uuid
from .patient import Patient
from .doctor import Doctor
from .appointment import Appointment
from .managers import SoftDeleteManager


class Prescription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='prescriptions')
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prescriptions'
    )

    medication_name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    duration_days = models.IntegerField(default=7)
    instructions = models.TextField(blank=True, null=True)

    refills_allowed = models.IntegerField(default=0)
    refills_used = models.IntegerField(default=0)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True
    )

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        db_table = 'prescriptions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['doctor', 'status']),
            models.Index(fields=['is_deleted']),
        ]

    def __str__(self):
        return f"{self.medication_name} ({self.dosage}) for {self.patient.user.full_name}"

    def can_refill(self):
        return self.status == self.Status.ACTIVE and self.refills_used < self.refills_allowed

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()
