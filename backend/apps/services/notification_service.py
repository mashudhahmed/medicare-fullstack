from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from apps.models.notification import Notification


class NotificationService:

    @staticmethod
    def create_in_app(user, title, message, notification_type='system', link=None):
        """Create an in-app notification"""
        return Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            link=link
        )

    @staticmethod
    def send_html_email(to_email, subject, template_name, context, plain_message=None):
        """
        Send HTML email using a template with plain text fallback.
        """
        try:
            # Render HTML content
            html_content = render_to_string(template_name, context)
            
            # Create plain text version (strip HTML tags)
            if plain_message is None:
                plain_message = strip_tags(html_content)
            
            # Create email with HTML and plain text alternatives
            email = EmailMultiAlternatives(
                subject=subject,
                body=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[to_email],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            return True
        except Exception as e:
            print(f"Email failed: {e}")
            return False

    @staticmethod
    def send_email(to_email, subject, message, html_message=None):
        """Send a plain text email notification"""
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Email failed: {e}")
            return False

    @staticmethod
    def send_email_with_template(to_email, subject, template_name, context):
        """Send email using Django's email template (legacy method)"""
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
    def _get_frontend_url():
        """Get the frontend URL from settings or use default"""
        return getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

    @staticmethod
    def notify_appointment_created(appointment):
        """Send notifications when appointment is created"""
        patient = appointment.patient.user
        doctor = appointment.doctor.user
        frontend_url = NotificationService._get_frontend_url()

        # Format appointment date
        formatted_date = appointment.appointment_date.strftime('%d %B %Y, %I:%M %p')

        # In-app notification for patient
        NotificationService.create_in_app(
            user=patient,
            title="Appointment Booked",
            message=f"Your appointment with Dr. {doctor.full_name} is scheduled for {formatted_date}",
            notification_type='appointment',
            link=f"/appointments/{appointment.id}"
        )

        # In-app notification for doctor
        NotificationService.create_in_app(
            user=doctor,
            title="New Appointment",
            message=f"New appointment with {patient.full_name} on {formatted_date}",
            notification_type='appointment',
            link=f"/appointments/{appointment.id}"
        )

        # HTML Email to patient
        context = {
            'patient_name': patient.full_name,
            'doctor_name': doctor.full_name,
            'appointment_date': formatted_date,
            'appointment_id': str(appointment.id),
            'specialty': doctor.specialty,
            'reason': appointment.reason,
            'frontend_url': frontend_url,
        }
        NotificationService.send_html_email(
            to_email=patient.email,
            subject="Appointment Confirmed - MediCare Hub",
            template_name='emails/appointment_confirmation.html',
            context=context,
            plain_message=f"Hello {patient.full_name}, your appointment with Dr. {doctor.full_name} has been booked for {formatted_date}."
        )

        # HTML Email to doctor
        doctor_context = {
            'doctor_name': doctor.full_name,
            'patient_name': patient.full_name,
            'appointment_date': formatted_date,
            'appointment_id': str(appointment.id),
            'reason': appointment.reason,
            'frontend_url': frontend_url,
        }
        NotificationService.send_html_email(
            to_email=doctor.email,
            subject="New Appointment - MediCare Hub",
            template_name='emails/doctor_new_appointment.html',
            context=doctor_context,
            plain_message=f"Hello Dr. {doctor.full_name}, you have a new appointment with {patient.full_name} on {formatted_date}."
        )

    @staticmethod
    def notify_appointment_status_change(appointment, old_status, new_status):
        """Send notifications when appointment status changes"""
        patient = appointment.patient.user
        doctor = appointment.doctor.user
        frontend_url = NotificationService._get_frontend_url()

        status_messages = {
            'confirmed': f"Your appointment has been confirmed by Dr. {doctor.full_name}",
            'completed': "Your appointment has been completed",
            'cancelled': "Your appointment has been cancelled",
            'in_progress': "Your appointment is now in progress",
            'no_show': "You did not show up for your appointment",
        }

        message = status_messages.get(new_status, f"Your appointment status has been updated to {new_status}")
        formatted_date = appointment.appointment_date.strftime('%d %B %Y, %I:%M %p')

        # In-app notification for patient
        NotificationService.create_in_app(
            user=patient,
            title=f"Appointment {new_status.title()}",
            message=message,
            notification_type='appointment',
            link=f"/appointments/{appointment.id}"
        )

        # HTML Email notification for patient
        context = {
            'patient_name': patient.full_name,
            'doctor_name': doctor.full_name,
            'appointment_date': formatted_date,
            'appointment_id': str(appointment.id),
            'status': new_status,
            'message': message,
            'frontend_url': frontend_url,
        }
        NotificationService.send_html_email(
            to_email=patient.email,
            subject=f"Appointment {new_status.title()} - MediCare Hub",
            template_name='emails/appointment_status_update.html',
            context=context,
            plain_message=f"Hello {patient.full_name}, {message}"
        )

    @staticmethod
    def notify_billing_created(billing):
        """Send notifications when billing is created"""
        patient = billing.patient.user
        frontend_url = NotificationService._get_frontend_url()

        # In-app notification for patient
        NotificationService.create_in_app(
            user=patient,
            title="New Invoice Generated",
            message=f"An invoice of ${billing.total_amount} has been generated. Due date: {billing.due_date}",
            notification_type='billing',
            link=f"/billing/{billing.id}"
        )

        # HTML Email notification for patient
        context = {
            'patient_name': patient.full_name,
            'invoice_number': billing.invoice_number,
            'amount': str(billing.amount),
            'tax': str(billing.tax),
            'discount': str(billing.discount),
            'total_amount': str(billing.total_amount),
            'due_date': billing.due_date.strftime('%d %B %Y'),
            'description': billing.description or 'Medical services',
            'frontend_url': frontend_url,
            'billing_id': str(billing.id),
        }
        NotificationService.send_html_email(
            to_email=patient.email,
            subject=f"Invoice #{billing.invoice_number} - MediCare Hub",
            template_name='emails/billing_invoice.html',
            context=context,
            plain_message=f"Hello {patient.full_name}, a new invoice of ${billing.total_amount} has been generated. Due date: {billing.due_date}."
        )

    @staticmethod
    def notify_medical_record_created(medical_record):
        """Send notifications when medical record is created"""
        patient = medical_record.patient.user
        doctor = medical_record.doctor.user if medical_record.doctor else None
        frontend_url = NotificationService._get_frontend_url()

        # In-app notification for patient
        NotificationService.create_in_app(
            user=patient,
            title="New Medical Record Added",
            message=f"A new {medical_record.record_type} record has been added to your medical history.",
            notification_type='medical',
            link=f"/medical-records/{medical_record.id}"
        )

        # HTML Email notification for patient
        doctor_name = f"Dr. {doctor.full_name}" if doctor else "A doctor"
        context = {
            'patient_name': patient.full_name,
            'doctor_name': doctor_name,
            'record_type': medical_record.record_type,
            'title': medical_record.title,
            'description': medical_record.description,
            'record_date': medical_record.record_date.strftime('%d %B %Y'),
            'frontend_url': frontend_url,
            'record_id': str(medical_record.id),
        }
        NotificationService.send_html_email(
            to_email=patient.email,
            subject=f"New Medical Record - MediCare Hub",
            template_name='emails/medical_record_added.html',
            context=context,
            plain_message=f"Hello {patient.full_name}, a new {medical_record.record_type} record has been added to your file."
        )

    @staticmethod
    def send_password_reset(user, reset_link):
        """Send password reset email with HTML template"""
        frontend_url = NotificationService._get_frontend_url()
        
        context = {
            'user_name': user.full_name,
            'reset_link': reset_link,
            'frontend_url': frontend_url,
            'email': user.email,
        }
        return NotificationService.send_html_email(
            to_email=user.email,
            subject="Reset Your Password - MediCare Hub",
            template_name='emails/password_reset.html',
            context=context,
            plain_message=f"Hello {user.full_name}, click the link to reset your password: {reset_link}"
        )

    @staticmethod
    def send_welcome_email(user):
        """Send welcome email with HTML template"""
        frontend_url = NotificationService._get_frontend_url()
        
        context = {
            'full_name': user.full_name,
            'role': user.role,
            'frontend_url': frontend_url,
            'email': user.email,
        }
        return NotificationService.send_html_email(
            to_email=user.email,
            subject="Welcome to MediCare Hub!",
            template_name='emails/welcome.html',
            context=context,
            plain_message=f"Welcome to MediCare Hub, {user.full_name}!"
        )

    @staticmethod
    def send_doctor_verified_email(doctor):
        """Send doctor verification email with HTML template"""
        frontend_url = NotificationService._get_frontend_url()
        user = doctor.user
        
        context = {
            'full_name': user.full_name,
            'specialty': doctor.specialty,
            'frontend_url': frontend_url,
            'email': user.email,
        }
        return NotificationService.send_html_email(
            to_email=user.email,
            subject="Your Doctor Account is Verified - MediCare Hub",
            template_name='emails/doctor_verified.html',
            context=context,
            plain_message=f"Hello Dr. {user.full_name}, your doctor account has been verified!"
        )

    @staticmethod
    def send_appointment_confirmation(appointment):
        """Send appointment confirmation email (legacy method - kept for compatibility)"""
        return NotificationService.notify_appointment_created(appointment)

    @staticmethod
    def send_appointment_reminder(appointment):
        """Send appointment reminder email with HTML template"""
        patient = appointment.patient.user
        doctor = appointment.doctor.user
        frontend_url = NotificationService._get_frontend_url()
        formatted_date = appointment.appointment_date.strftime('%d %B %Y, %I:%M %p')

        # In-app notification
        NotificationService.create_in_app(
            user=patient,
            title="Appointment Reminder",
            message=f"Reminder: You have an appointment with Dr. {doctor.full_name} tomorrow at {formatted_date}",
            notification_type='appointment',
            link=f"/appointments/{appointment.id}"
        )

        # HTML Email reminder
        context = {
            'patient_name': patient.full_name,
            'doctor_name': doctor.full_name,
            'appointment_date': formatted_date,
            'appointment_id': str(appointment.id),
            'specialty': doctor.specialty,
            'frontend_url': frontend_url,
        }
        return NotificationService.send_html_email(
            to_email=patient.email,
            subject="Appointment Reminder - MediCare Hub",
            template_name='emails/appointment_reminder.html',
            context=context,
            plain_message=f"Hello {patient.full_name}, this is a reminder for your appointment with Dr. {doctor.full_name} tomorrow at {formatted_date}."
        )

    @staticmethod
    def send_doctor_new_appointment_notification(appointment):
        """Send notification to doctor when new appointment is booked"""
        doctor = appointment.doctor.user
        patient = appointment.patient.user
        frontend_url = NotificationService._get_frontend_url()
        formatted_date = appointment.appointment_date.strftime('%d %B %Y, %I:%M %p')

        context = {
            'doctor_name': doctor.full_name,
            'patient_name': patient.full_name,
            'appointment_date': formatted_date,
            'appointment_id': str(appointment.id),
            'reason': appointment.reason,
            'frontend_url': frontend_url,
        }
        return NotificationService.send_html_email(
            to_email=doctor.email,
            subject="New Appointment Booking - MediCare Hub",
            template_name='emails/doctor_new_appointment.html',
            context=context,
            plain_message=f"Hello Dr. {doctor.full_name}, you have a new appointment with {patient.full_name} on {formatted_date}."
        )