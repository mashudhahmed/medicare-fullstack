from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_appointment_reminders(self):
    from apps.models.appointment import Appointment
    from apps.services.notification_service import NotificationService

    now = timezone.now()
    reminder_start = now + timedelta(hours=23)
    reminder_end = now + timedelta(hours=25)

    upcoming_appointments = Appointment.objects.filter(
        status__in=[Appointment.Status.CONFIRMED, 'confirmed'],
        appointment_date__range=(reminder_start, reminder_end)
    ).select_related('patient__user', 'doctor__user')

    count = 0
    for appt in upcoming_appointments:
        try:
            NotificationService.send_user_notification(
                user=appt.patient.user,
                title="Appointment Reminder",
                message=f"Reminder: You have an appointment with Dr. {appt.doctor.user.get_full_name()} tomorrow at {appt.appointment_date.strftime('%H:%M')}.",
                category="APPOINTMENT_REMINDER",
                send_email=True,
                email_template="APPOINTMENT_REMINDER",
                context={
                    "doctor_name": appt.doctor.user.get_full_name(),
                    "appointment_date": appt.appointment_date.strftime('%Y-%m-%d %H:%M'),
                }
            )
            count += 1
        except Exception as exc:
            logger.error(f"Error sending reminder for appointment {appt.id}: {exc}")

    return f"Dispatched {count} reminders successfully."