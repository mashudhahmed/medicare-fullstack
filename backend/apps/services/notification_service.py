from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    
    @staticmethod
    def send_email(subject, message, recipient_list):
        """Send email notification."""
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                recipient_list,
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False
    
    @staticmethod
    def send_appointment_confirmation(appointment):
        """Send appointment confirmation email."""
        subject = f"Appointment Confirmation - {appointment.date}"
        message = f"""
        Dear {appointment.patient.user.get_full_name()},
        
        Your appointment has been confirmed:
        
        Doctor: Dr. {appointment.doctor.user.get_full_name()}
        Date: {appointment.date}
        Time: {appointment.start_time}
        Mode: {appointment.get_mode_display()}
        
        Thank you for choosing MediCare Hub.
        """
        return NotificationService.send_email(
            subject,
            message,
            [appointment.patient.user.email]
        )
