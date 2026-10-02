from rest_framework import serializers
from apps.models.chat_message import ChatMessage
from apps.models.user import User
from apps.models.appointment import Appointment


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    sender_avatar = serializers.CharField(source='sender.profile_picture', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    recipient_role = serializers.CharField(source='recipient.role', read_only=True)
    recipient_avatar = serializers.CharField(source='recipient.profile_picture', read_only=True)

    class Meta:
        model = ChatMessage
        fields = [
            'id',
            'appointment',
            'sender',
            'sender_name',
            'sender_role',
            'sender_avatar',
            'recipient',
            'recipient_name',
            'recipient_role',
            'recipient_avatar',
            'content',
            'attachment_url',
            'is_read',
            'read_at',
            'created_at',
        ]
        read_only_fields = ['id', 'sender', 'is_read', 'read_at', 'created_at']


class CreateChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = [
            'recipient',
            'appointment',
            'content',
            'attachment_url',
        ]

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Message content cannot be empty.")
        return value.strip()


class ConversationSummarySerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    full_name = serializers.CharField()
    role = serializers.CharField()
    profile_picture = serializers.CharField(allow_null=True)
    last_message = serializers.CharField()
    last_message_at = serializers.DateTimeField()
    unread_count = serializers.IntegerField()
