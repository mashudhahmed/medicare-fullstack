from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


def send_single_appointment_reminder(appointment):
    """Dispatch in-app and email reminder for a single appointment and mark as sent"""
    from apps.services.notification_service import NotificationService

    doctor_name = appointment.doctor.user.get_full_name()
    patient_name = appointment.patient.user.get_full_name()
    date_str = appointment.appointment_date.strftime('%Y-%m-%d %H:%M')

    # Send reminder to patient
    NotificationService.send_user_notification(
        user=appointment.patient.user,
        title="Upcoming Appointment Reminder",
        message=f"Reminder: You have an appointment with Dr. {doctor_name} scheduled for {date_str}.",
        category="APPOINTMENT_REMINDER",
        send_email=True,
        email_template="APPOINTMENT_REMINDER",
        context={
            "doctor_name": doctor_name,
            "patient_name": patient_name,
            "appointment_date": date_str,
            "video_room_id": appointment.video_room_id,
        }
    )

    # Send notification to doctor
    NotificationService.send_user_notification(
        user=appointment.doctor.user,
        title="Upcoming Consultation Reminder",
        message=f"Consultation reminder with patient {patient_name} scheduled for {date_str}.",
        category="APPOINTMENT_REMINDER"
    )

    appointment.reminder_sent = True
    appointment.reminder_sent_at = timezone.now()
    appointment.save(update_fields=['reminder_sent', 'reminder_sent_at', 'updated_at'])
    return True


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_appointment_reminders(self=None):
    """
    Automated Celery task for 24-hour advance appointment reminders.
    Finds confirmed appointments in the 23-25 hour window that haven't received a reminder.
    """
    from apps.models.appointment import Appointment

    now = timezone.now()
    reminder_start = now + timedelta(hours=23)
    reminder_end = now + timedelta(hours=25)

    upcoming_appointments = Appointment.objects.filter(
        status__in=[Appointment.Status.CONFIRMED, 'confirmed'],
        appointment_date__range=(reminder_start, reminder_end),
        reminder_sent=False,
        is_deleted=False
    ).select_related('patient__user', 'doctor__user')

    count = 0
    for appt in upcoming_appointments:
        try:
            send_single_appointment_reminder(appt)
            count += 1
        except Exception as exc:
            logger.error(f"Error sending 24h reminder for appointment {appt.id}: {exc}")

    return f"Dispatched {count} 24-hour reminders successfully."


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_same_day_reminders(self=None):
    """
    Automated Celery task for same-day 2-hour advance reminders with video room details.
    """
    from apps.models.appointment import Appointment
    from apps.services.notification_service import NotificationService

    now = timezone.now()
    window_start = now + timedelta(minutes=15)
    window_end = now + timedelta(hours=2)

    appointments_soon = Appointment.objects.filter(
        status__in=[Appointment.Status.CONFIRMED, 'confirmed'],
        appointment_date__range=(window_start, window_end),
        is_deleted=False
    ).select_related('patient__user', 'doctor__user')

    count = 0
    for appt in appointments_soon:
        try:
            room_info = f" Video Room ID: {appt.video_room_id}" if appt.video_room_id else ""
            NotificationService.send_user_notification(
                user=appt.patient.user,
                title="Appointment Starting Soon",
                message=f"Your appointment with Dr. {appt.doctor.user.get_full_name()} begins at {appt.appointment_date.strftime('%H:%M')}.{room_info}",
                category="APPOINTMENT_REMINDER"
            )
            count += 1
        except Exception as exc:
            logger.error(f"Error sending same-day alert for appointment {appt.id}: {exc}")

    return f"Dispatched {count} same-day reminders."