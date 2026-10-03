from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.models.notification import Notification
from apps.schemas.notification_schema import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """List all notifications for current user"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')


class MarkNotificationReadView(APIView):
    """Mark a single notification as read"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(id=pk, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({"message": "Notification marked as read"})
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)


class MarkAllNotificationsReadView(APIView):
    """Mark all notifications as read"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read"})


class NotificationUnreadCountView(APIView):
    """Get count of unread notifications and the most recent notification for real-time alerting"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = Notification.objects.filter(user=user, is_read=False).order_by('-created_at')
        count = qs.count()
        latest = qs.first()

        latest_data = None
        if latest:
            latest_data = {
                'id': str(latest.id),
                'title': latest.title,
                'message': latest.message,
                'notification_type': latest.notification_type,
                'created_at': latest.created_at.isoformat(),
            }

        return Response({
            'unread_count': count,
            'latest_notification': latest_data,
        }, status=status.HTTP_200_OK)