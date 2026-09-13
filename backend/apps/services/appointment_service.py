from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.models.appointment import Appointment
from apps.models.billing import Billing
from apps.services.notification_service import NotificationService

class AppointmentService:
    SLOT_DURATION_MINUTES = 30

    @classmethod
    def schedule_appointment(cls, patient, doctor, scheduled_time, reason=""):
        if scheduled_time <= timezone.now():
            raise ValidationError("Appointments cannot be scheduled in the past.")

        slot_end_time = scheduled_time + timedelta(minutes=cls.SLOT_DURATION_MINUTES)

        with transaction.atomic():
            doctor_conflict = Appointment.objects.select_for_update().filter(
                doctor=doctor,
                status__in=['SCHEDULED', 'CONFIRMED'],
                appointment_date__lt=slot_end_time,
                appointment_date__gte=scheduled_time - timedelta(minutes=cls.SLOT_DURATION_MINUTES)
            ).exists()

            if doctor_conflict:
                raise ValidationError("The selected doctor is unavailable during this time slot.")

            appointment = Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                appointment_date=scheduled_time,
                reason=reason,
                status='CONFIRMED'
            )

            NotificationService.send_user_notification(
                user=doctor.user,
                title="New Appointment Scheduled",
                message=f"New booking with patient {patient.user.get_full_name()} on {scheduled_time.strftime('%Y-%m-%d %H:%M')}.",
                category="APPOINTMENT_CONFIRMATION",
                send_email=True,
                email_template="APPOINTMENT_CONFIRMATION",
                context={
                    "doctor_name": doctor.user.get_full_name(),
                    "patient_name": patient.user.get_full_name(),
                    "appointment_date": scheduled_time.strftime('%Y-%m-%d %H:%M'),
                }
            )

            return appointment

    @classmethod
    def complete_appointment(cls, appointment, consultation_fee=50.00):
        with transaction.atomic():
            appointment.status = 'COMPLETED'
            appointment.save(update_fields=['status'])

            billing, created = Billing.objects.get_or_create(
                appointment=appointment,
                defaults={
                    'patient': appointment.patient,
                    'amount': consultation_fee,
                    'total_amount': consultation_fee,
                    'status': 'PENDING'
                }
            )

            NotificationService.send_user_notification(
                user=appointment.patient.user,
                title="Invoice Ready",
                message=f"Your consultation invoice of ${consultation_fee:.2f} is ready for payment.",
                category="BILLING"
            )

            return billing