from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string


class NotificationService:
    @staticmethod
    def send_email(to_email, subject, template_name, context):
        """Send email using Django's email backend"""
        try:
            html_message = render_to_string(template_name, context)
            send_mail(
                subject=subject,
                message='',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    @staticmethod
    def send_appointment_confirmation(appointment):
        """Send appointment confirmation email"""
        context = {
            'patient_name': appointment.patient.user.full_name,
            'doctor_name': appointment.doctor.user.full_name,
            'appointment_date': appointment.appointment_date,
            'appointment_id': appointment.id,
        }
        return NotificationService.send_email(
            to_email=appointment.patient.user.email,
            subject='Appointment Confirmation',
            template_name='emails/appointment_confirmation.html',
            context=context
        )

    @staticmethod
    def send_appointment_reminder(appointment):
        """Send appointment reminder email"""
        context = {
            'patient_name': appointment.patient.user.full_name,
            'doctor_name': appointment.doctor.user.full_name,
            'appointment_date': appointment.appointment_date,
            'appointment_id': appointment.id,
        }
        return NotificationService.send_email(
            to_email=appointment.patient.user.email,
            subject='Appointment Reminder',
            template_name='emails/appointment_reminder.html',
            context=context
        )