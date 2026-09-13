from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid
from .patient import Patient
from .appointment import Appointment
from .managers import SoftDeleteManager


class Billing(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PAID = 'paid', 'Paid'
        OVERDUE = 'overdue', 'Overdue'
        CANCELLED = 'cancelled', 'Cancelled'

    class PaymentMethod(models.TextChoices):
        CASH = 'cash', 'Cash'
        CARD = 'card', 'Card'
        INSURANCE = 'insurance', 'Insurance'
        ONLINE = 'online', 'Online'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='billings')
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='billings'
    )

    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, blank=True, null=True)
    due_date = models.DateField(null=True, blank=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    description = models.TextField(blank=True, null=True)

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Soft Delete Manager
    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        db_table = 'billings'
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['due_date']),
            models.Index(fields=['is_deleted']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Billing #{self.invoice_number} - {self.patient.user.full_name}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
        if not self.due_date:
            self.due_date = timezone.now().date() + timedelta(days=30)
        self.total_amount = self.amount + self.tax - self.discount
        super().save(*args, **kwargs)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()