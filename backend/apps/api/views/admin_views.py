from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.models.user import User
from apps.schemas.user_schema import UserSerializer
from apps.core.permissions import IsAdmin


class ListUsersView(generics.ListAPIView):
    """List all users (Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.filter(is_deleted=False)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, delete user (Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.filter(is_deleted=False)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        return Response({
            'message': 'User deleted successfully'
        }, status=status.HTTP_200_OK)


class UpdateUserStatusView(APIView):
    """Update user status (Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, is_deleted=False)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

        status_value = request.data.get('status')
        if status_value not in dict(User.Status.choices):
            return Response({
                'error': 'Invalid status'
            }, status=status.HTTP_400_BAD_REQUEST)

        user.status = status_value
        user.save()

        return Response({
            'message': 'User status updated successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)