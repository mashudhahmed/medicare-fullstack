from django.db.models import Q, Max
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.models.chat_message import ChatMessage
from apps.models.user import User
from apps.models.appointment import Appointment
from apps.schemas.chat_schema import (
    ChatMessageSerializer,
    CreateChatMessageSerializer,
    ConversationSummarySerializer,
)
from apps.services.notification_service import NotificationService
from apps.utils.audit import log_audit


class ConversationListView(APIView):
    """List all active message threads for the authenticated user"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        current_user = request.user

        # Get all distinct user IDs that current_user chatted with
        sent_to = ChatMessage.objects.filter(
            sender=current_user, is_deleted=False
        ).values_list('recipient_id', flat=True)

        received_from = ChatMessage.objects.filter(
            recipient=current_user, is_deleted=False
        ).values_list('sender_id', flat=True)

        partner_ids = set(sent_to).union(set(received_from))

        conversations = []
        for partner_id in partner_ids:
            try:
                partner = User.objects.get(id=partner_id, is_active=True)
            except User.DoesNotExist:
                continue

            # Latest message
            last_msg = ChatMessage.objects.filter(
                (Q(sender=current_user, recipient=partner) | Q(sender=partner, recipient=current_user)),
                is_deleted=False
            ).order_by('-created_at').first()

            if not last_msg:
                continue

            # Unread count sent by partner to current user
            unread_count = ChatMessage.objects.filter(
                sender=partner,
                recipient=current_user,
                is_read=False,
                is_deleted=False
            ).count()

            conversations.append({
                'user_id': partner.id,
                'full_name': partner.get_full_name(),
                'role': partner.role,
                'profile_picture': partner.profile_picture or '',
                'last_message': last_msg.content,
                'last_message_at': last_msg.created_at,
                'unread_count': unread_count,
            })

        # Sort by most recent message
        conversations.sort(key=lambda c: c['last_message_at'], reverse=True)
        serializer = ConversationSummarySerializer(conversations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MessageThreadView(APIView):
    """Retrieve full chronological conversation with a specific user and auto-mark incoming as read"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        current_user = request.user
        try:
            partner = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve messages
        messages = ChatMessage.objects.filter(
            (Q(sender=current_user, recipient=partner) | Q(sender=partner, recipient=current_user)),
            is_deleted=False
        ).select_related('sender', 'recipient', 'appointment').order_by('created_at')

        # Auto-mark unread incoming messages as read
        unread_incoming = messages.filter(sender=partner, recipient=current_user, is_read=False)
        if unread_incoming.exists():
            unread_incoming.update(is_read=True, read_at=timezone.now())

        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SendMessageView(generics.CreateAPIView):
    """Send a direct or consultation follow-up message"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CreateChatMessageSerializer

    def perform_create(self, serializer):
        sender = self.request.user
        recipient = serializer.validated_data['recipient']

        message = serializer.save(sender=sender)

        # Send in-app notification to recipient
        preview = message.content[:80] + ('...' if len(message.content) > 80 else '')
        NotificationService.send_user_notification(
            user=recipient,
            title=f"New Message from {sender.get_full_name()}",
            message=preview,
            category="GENERAL"
        )

        log_audit(
            request=self.request,
            action='CREATE',
            resource_type='ChatMessage',
            resource_id=str(message.id),
            user=sender,
            details={
                'recipient_id': str(recipient.id),
                'appointment_id': str(message.appointment.id) if message.appointment else None
            }
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        full_serializer = ChatMessageSerializer(serializer.instance)
        headers = self.get_success_headers(full_serializer.data)
        return Response(full_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class MarkMessagesReadView(APIView):
    """Mark all unread messages from a specific partner as read"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        updated_count = ChatMessage.objects.filter(
            sender_id=user_id,
            recipient=request.user,
            is_read=False,
            is_deleted=False
        ).update(is_read=True, read_at=timezone.now())

        return Response({
            'message': f"Marked {updated_count} messages as read.",
            'updated_count': updated_count
        }, status=status.HTTP_200_OK)


class UnreadMessageCountView(APIView):
    """Total unread message count for navbar badges"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = ChatMessage.objects.filter(
            recipient=request.user,
            is_read=False,
            is_deleted=False
        ).count()
        return Response({'unread_count': count}, status=status.HTTP_200_OK)
