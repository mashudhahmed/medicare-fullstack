from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count, Sum
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.models.models import Patient, Doctor, Appointment, Invoice, Prescription, SystemLog, AdminProfile
from apps.schemas import (
    AdminSerializer, AdminCreateSerializer, AdminUpdateSerializer,
    AdminUserManagementSerializer, AdminStatsSerializer,
    DoctorSerializer, DoctorApprovalSerializer, UserSerializer
)
from apps.utils import generate_uuid

User = get_user_model()

class AdminDashboardView(APIView):
    """Admin dashboard with statistics"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get statistics
        total_users = User.objects.filter(is_active=True).count()
        total_patients = Patient.objects.count()
        total_doctors = Doctor.objects.count()
        pending_doctors = Doctor.objects.filter(is_approved=False).count()
        total_appointments = Appointment.objects.count()
        pending_appointments = Appointment.objects.filter(status='pending').count()
        today_appointments = Appointment.objects.filter(date=timezone.now().date()).count()
        
        # Revenue stats
        total_revenue = Invoice.objects.filter(status='paid').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        pending_invoices = Invoice.objects.filter(status='pending').count()
        
        # Recent activities
        recent_activities = SystemLog.objects.all()[:10]
        
        data = {
            'total_users': total_users,
            'total_patients': total_patients,
            'total_doctors': total_doctors,
            'pending_doctors': pending_doctors,
            'total_appointments': total_appointments,
            'pending_appointments': pending_appointments,
            'today_appointments': today_appointments,
            'total_revenue': total_revenue,
            'pending_invoices': pending_invoices,
            'recent_activities': [
                {
                    'id': log.id,
                    'admin': log.admin.username if log.admin else 'System',
                    'action': log.action_type,
                    'model': log.model_name,
                    'object': log.object_repr,
                    'time': log.created_at.strftime('%Y-%m-%d %H:%M')
                }
                for log in recent_activities
            ]
        }
        
        return Response(data)

class AdminUserListView(generics.ListAPIView):
    """List all users with filtering"""
    serializer_class = AdminUserManagementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_admin_user:
            return User.objects.none()
        
        queryset = User.objects.all()
        
        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search by username or email
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) | 
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        return queryset.order_by('-date_joined')

class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update or delete a user"""
    serializer_class = AdminUserManagementSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        
        # Prevent deleting self
        if user == request.user:
            return Response({'error': 'Cannot delete your own account'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Soft delete
        user.is_active = False
        user.deleted_at = timezone.now()
        user.save()
        
        # Log the action
        SystemLog.objects.create(
            admin=request.user,
            action_type='delete',
            model_name='User',
            object_id=str(user.id),
            object_repr=user.username,
            changes={'deleted': True}
        )
        
        return Response({'message': 'User deleted successfully'})

class AdminDoctorApprovalView(APIView):
    """Approve or reject doctor applications"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, doctor_id):
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            doctor = Doctor.objects.get(id=doctor_id)
            is_approved = request.data.get('is_approved')
            
            if is_approved is None:
                return Response({'error': 'is_approved field required'}, status=status.HTTP_400_BAD_REQUEST)
            
            doctor.is_approved = is_approved
            doctor.save()
            
            # Log the action
            SystemLog.objects.create(
                admin=request.user,
                action_type='approve' if is_approved else 'reject',
                model_name='Doctor',
                object_id=str(doctor.id),
                object_repr=doctor.user.username,
                changes={'is_approved': is_approved}
            )
            
            return Response({
                'message': f'Doctor {"approved" if is_approved else "rejected"} successfully',
                'doctor_id': doctor.id,
                'is_approved': doctor.is_approved
            })
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)

class AdminPendingDoctorsView(generics.ListAPIView):
    """List all pending doctor applications"""
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_admin_user:
            return Doctor.objects.none()
        return Doctor.objects.filter(is_approved=False)

class AdminSystemLogsView(generics.ListAPIView):
    """View system audit logs"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AdminUserManagementSerializer  # Will create a separate serializer
    
    def get(self, request):
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        logs = SystemLog.objects.all()[:100]
        
        data = [{
            'id': log.id,
            'admin': log.admin.username if log.admin else 'System',
            'action_type': log.action_type,
            'model_name': log.model_name,
            'object_id': log.object_id,
            'object_repr': log.object_repr,
            'changes': log.changes,
            'ip_address': log.ip_address,
            'created_at': log.created_at.strftime('%Y-%m-%d %H:%M')
        } for log in logs]
        
        return Response(data)

class AdminSystemSettingsView(APIView):
    """Manage system settings"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Return current system settings
        settings = {
            'app_name': 'MediCare Hub',
            'version': '1.0.0',
            'maintenance_mode': False,
            'registration_enabled': True,
            'max_appointments_per_day': 10,
            'consultation_fee_default': 500,
            'timezone': 'UTC',
            'currency': 'USD',
            'email_notifications': True,
            'sms_notifications': False
        }
        
        return Response(settings)
    
    def post(self, request):
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Update system settings (simplified - would use a Settings model in production)
        # Log the action
        SystemLog.objects.create(
            admin=request.user,
            action_type='setting',
            model_name='SystemSettings',
            changes={'updated_fields': list(request.data.keys())}
        )
        
        return Response({'message': 'Settings updated successfully'})

class AdminReportView(APIView):
    """Generate various reports"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        report_type = request.query_params.get('type', 'overview')
        
        if report_type == 'appointments':
            # Appointments report
            data = {
                'total': Appointment.objects.count(),
                'pending': Appointment.objects.filter(status='pending').count(),
                'confirmed': Appointment.objects.filter(status='confirmed').count(),
                'completed': Appointment.objects.filter(status='completed').count(),
                'cancelled': Appointment.objects.filter(status='cancelled').count(),
                'by_mode': {
                    'video': Appointment.objects.filter(mode='video').count(),
                    'in_person': Appointment.objects.filter(mode='in_person').count(),
                    'phone': Appointment.objects.filter(mode='phone').count(),
                }
            }
        elif report_type == 'revenue':
            # Revenue report
            data = {
                'total_revenue': Invoice.objects.filter(status='paid').aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
                'pending_invoices': Invoice.objects.filter(status='pending').count(),
                'overdue_invoices': Invoice.objects.filter(status='pending', due_date__lt=timezone.now().date()).count(),
                'paid_invoices': Invoice.objects.filter(status='paid').count(),
            }
        elif report_type == 'doctors':
            # Doctors report
            data = {
                'total': Doctor.objects.count(),
                'approved': Doctor.objects.filter(is_approved=True).count(),
                'pending': Doctor.objects.filter(is_approved=False).count(),
                'available': Doctor.objects.filter(is_available=True).count(),
                'avg_rating': Doctor.objects.filter(is_approved=True).aggregate(avg=Sum('rating') / Count('id'))['avg'] or 0,
            }
        else:
            # Overview report
            data = {
                'users': User.objects.count(),
                'patients': Patient.objects.count(),
                'doctors': Doctor.objects.count(),
                'appointments': Appointment.objects.count(),
                'revenue': Invoice.objects.filter(status='paid').aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
            }
        
        return Response(data)
