from django.db import models
from django.conf import settings
from django.utils import timezone
from .patient import Patient
from .doctor import Doctor

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
        ('rescheduled', 'Rescheduled'),
    )
    
    MODE_CHOICES = (
        ('in_person', 'In Person'),
        ('video', 'Video Consultation'),
        ('phone', 'Phone Consultation'),
    )
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='in_person')
    reason = models.TextField()
    notes = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    rescheduled_from = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='rescheduled_to'
    )
    meeting_link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'appointments'
        indexes = [
            models.Index(fields=['doctor', 'date']),
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['date', 'status']),
        ]
        ordering = ['-date', '-start_time']
    
    def __str__(self):
        return f"{self.patient.user.get_full_name()} - {self.doctor.user.get_full_name()} - {self.date} {self.start_time}"
    
    def is_upcoming(self):
        return self.date > timezone.now().date() or (
            self.date == timezone.now().date() and 
            self.start_time > timezone.now().time()
        )