import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from celery import shared_task

from apps.models.notification import Notification

logger = logging.getLogger(__name__)

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,)
)
def send_async_email_task(self, recipient_email: str, subject: str, message: str, html_content: str = None):
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_content,
            fail_silently=False,
        )
        logger.info(f"Transactional email sent to {recipient_email}")
    except Exception as exc:
        logger.error(f"Failed sending email to {recipient_email}: {exc}")
        raise exc

class NotificationService:
    TEMPLATE_MAPPINGS = {
        "WELCOME": "emails/welcome.html",
        "APPOINTMENT_CONFIRMATION": "emails/appointment_confirmation.html",
        "APPOINTMENT_REMINDER": "emails/appointment_reminder.html",
        "DOCTOR_VERIFIED": "emails/doctor_verified.html",
        "PASSWORD_RESET": "emails/password_reset.html",
    }

    @classmethod
    def send_user_notification(
        cls,
        user,
        title: str,
        message: str,
        category: str = "GENERAL",
        send_email: bool = True,
        email_template: str = None,
        context: dict = None,
    ):
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            category=category
        )

        cls._broadcast_websocket(user.id, notification)

        if send_email and getattr(user, "email", None):
            cls._enqueue_email(
                user=user,
                title=title,
                message=message,
                email_template=email_template,
                context=context or {},
            )

        return notification

    @classmethod
    def _broadcast_websocket(cls, user_id: int, notification: Notification):
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                group_name = f"user_notifications_{user_id}"
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        "type": "send_notification",
                        "id": notification.id,
                        "title": notification.title,
                        "message": notification.message,
                        "category": notification.category,
                        "created_at": (
                            notification.created_at.isoformat()
                            if hasattr(notification, "created_at") and notification.created_at
                            else None
                        ),
                    },
                )
        except Exception as exc:
            logger.error(f"WebSocket broadcast error for user {user_id}: {exc}")

    @classmethod
    def _enqueue_email(
        cls,
        user,
        title: str,
        message: str,
        email_template: str = None,
        context: dict = None,
    ):
        try:
            template_path = cls.TEMPLATE_MAPPINGS.get(email_template, None)
            email_context = {
                "user": user,
                "title": title,
                "message": message,
                "site_name": getattr(settings, "SITE_NAME", "Medicare Hub"),
                **(context or {}),
            }

            html_content = None
            if template_path:
                html_content = render_to_string(template_path, email_context)

            subject = f"[{getattr(settings, 'SITE_NAME', 'Medicare Hub')}] {title}"

            send_async_email_task.delay(
                recipient_email=user.email,
                subject=subject,
                message=message,
                html_content=html_content,
            )
        except Exception as exc:
            logger.error(f"Failed to enqueue email task for {user.email}: {exc}")