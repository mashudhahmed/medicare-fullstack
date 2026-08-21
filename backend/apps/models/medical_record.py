from django.db import models
from django.utils import timezone
import uuid
from .patient import Patient
from .doctor import Doctor


class MedicalRecord(models.Model):
    class RecordType(models.TextChoices):
        DIAGNOSIS = 'diagnosis', 'Diagnosis'
        PRESCRIPTION = 'prescription', 'Prescription'
        TEST_RESULT = 'test_result', 'Test Result'
        VACCINATION = 'vaccination', 'Vaccination'
        SURGERY = 'surgery', 'Surgery'
        OTHER = 'other', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_records')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, related_name='medical_records')

    record_type = models.CharField(max_length=20, choices=RecordType.choices)
    title = models.CharField(max_length=255)
    description = models.TextField()
    details = models.JSONField(default=dict, blank=True)
    attachments = models.JSONField(default=list, blank=True)

    record_date = models.DateField()
    is_confidential = models.BooleanField(default=False)

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'medical_records'
        indexes = [
            models.Index(fields=['patient', 'record_type']),
            models.Index(fields=['record_date']),
            models.Index(fields=['is_deleted']),
        ]
        ordering = ['-record_date']

    def __str__(self):
        return f"{self.record_type}: {self.title} - {self.patient.user.full_name}"

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()