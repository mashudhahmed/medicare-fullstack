import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from .doctor import Doctor
from .patient import Patient
from .appointment import Appointment
from .managers import SoftDeleteManager


class DoctorReview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='reviews')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='doctor_reviews')
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviews'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, default='')

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        db_table = 'doctor_reviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['doctor', 'rating']),
            models.Index(fields=['patient', 'doctor']),
        ]

    def __str__(self):
        return f"{self.rating}★ for Dr. {self.doctor.user.full_name} by {self.patient.user.full_name}"

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()
