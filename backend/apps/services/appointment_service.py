from django.db import models
from django.utils import timezone
from apps.models.appointment import Appointment
from apps.models.patient import Patient
from apps.models.doctor import Doctor
from apps.services.notification_service import NotificationService


class AppointmentService:
    @staticmethod
    def check_availability(doctor_id, appointment_date, duration_minutes=30):
        """Check if a doctor is available at a given time"""
        end_time = appointment_date + timezone.timedelta(minutes=duration_minutes)

        overlapping = Appointment.objects.filter(
            doctor_id=doctor_id,
            appointment_date__lt=end_time,
            appointment_date__gt=appointment_date - timezone.timedelta(minutes=duration_minutes),
            status__in=['pending', 'confirmed', 'in_progress'],
            is_deleted=False
        ).exists()

        return not overlapping

    @staticmethod
    def get_upcoming_appointments(user, days_ahead=7):
        """Get upcoming appointments for a user"""
        now = timezone.now()
        future = now + timezone.timedelta(days=days_ahead)

        if user.role == 'patient':
            return Appointment.objects.filter(
                patient__user=user,
                appointment_date__gte=now,
                appointment_date__lte=future,
                status__in=['pending', 'confirmed'],
                is_deleted=False
            ).order_by('appointment_date')
        elif user.role == 'doctor':
            return Appointment.objects.filter(
                doctor__user=user,
                appointment_date__gte=now,
                appointment_date__lte=future,
                status__in=['pending', 'confirmed'],
                is_deleted=False
            ).order_by('appointment_date')
        return Appointment.objects.none()

    @staticmethod
    def cancel_appointment(appointment_id, user):
        """Cancel an appointment"""
        try:
            appointment = Appointment.objects.get(id=appointment_id, is_deleted=False)
        except Appointment.DoesNotExist:
            return None, "Appointment not found"

        if user.role not in ['patient', 'doctor', 'admin']:
            return None, "You cannot cancel this appointment"

        if appointment.status in ['completed', 'cancelled', 'no_show']:
            return None, f"Cannot cancel appointment with status: {appointment.status}"

        old_status = appointment.status
        appointment.status = 'cancelled'
        appointment.save()

        # Send notification
        NotificationService.notify_appointment_status_change(appointment, old_status, 'cancelled')

        return appointment, None

    @staticmethod
    def update_appointment_status(appointment, new_status, user):
        """Update appointment status and send notifications"""
        if appointment.status == new_status:
            return appointment, "Status already set to this value"

        old_status = appointment.status
        appointment.status = new_status
        appointment.save()

        # Send notification for status change
        NotificationService.notify_appointment_status_change(appointment, old_status, new_status)

        return appointment, None

    @staticmethod
    def get_appointment_stats(doctor_id=None):
        """Get appointment statistics"""
        queryset = Appointment.objects.filter(is_deleted=False)

        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        total = queryset.count()
        pending = queryset.filter(status='pending').count()
        confirmed = queryset.filter(status='confirmed').count()
        completed = queryset.filter(status='completed').count()
        cancelled = queryset.filter(status='cancelled').count()

        return {
            'total': total,
            'pending': pending,
            'confirmed': confirmed,
            'completed': completed,
            'cancelled': cancelled,
        }