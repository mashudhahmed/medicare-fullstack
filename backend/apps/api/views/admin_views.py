from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.models.user import User
from apps.models.doctor import Doctor
from apps.models.patient import Patient
from apps.models.appointment import Appointment
from apps.schemas.user_schema import UserSerializer
from apps.schemas.doctor_schema import DoctorSerializer
from apps.core.permissions import IsAdmin
from apps.services.notification_service import NotificationService


class AdminDashboardView(APIView):
    """Admin dashboard stats"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response({
            'total_users': User.objects.count(),
            'total_patients': Patient.objects.count(),
            'total_doctors': Doctor.objects.filter(is_verified=True).count(),
            'pending_doctors': Doctor.objects.filter(is_verified=False, is_deleted=False).count(),
            'total_appointments': Appointment.objects.count(),
            'pending_appointments': Appointment.objects.filter(status='pending').count(),
            'confirmed_appointments': Appointment.objects.filter(status='confirmed').count(),
            'completed_appointments': Appointment.objects.filter(status='completed').count(),
        })


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


class PendingDoctorsView(generics.ListAPIView):
    """List doctors pending verification (Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = DoctorSerializer
    queryset = Doctor.objects.filter(is_verified=False, is_deleted=False)


class VerifyDoctorView(APIView):
    """
    Admin can verify / unverify a doctor.
    Accepts both PATCH and POST for frontend compatibility.
    Body: { "is_verified": true/false } – if omitted on approve route, defaults to true.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def _verify(self, request, doctor_id):
        try:
            doctor = Doctor.objects.get(id=doctor_id, is_deleted=False)
        except Doctor.DoesNotExist:
            return Response(
                {"error": "Doctor not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        is_verified = request.data.get('is_verified')
        if is_verified is None:
            # Default to True when called from the /approve/ alias
            is_verified = True

        doctor.is_verified = bool(is_verified)
        doctor.save()

        # Also mark the user as approved when verified
        if doctor.is_verified and doctor.user.status == User.Status.PENDING:
            doctor.user.status = User.Status.APPROVED
            doctor.user.save(update_fields=['status'])

        status_text = "verified" if doctor.is_verified else "unverified"
        NotificationService.create_in_app(
            user=doctor.user,
            title=f"Account {status_text.title()}",
            message=f"Your doctor account has been {status_text} by the administrator.",
            notification_type='system'
        )

        return Response({
            "message": f"Doctor has been {status_text} successfully",
            "doctor": DoctorSerializer(doctor).data
        }, status=status.HTTP_200_OK)

    def patch(self, request, doctor_id):
        return self._verify(request, doctor_id)

    def post(self, request, doctor_id):
        return self._verify(request, doctor_id)
