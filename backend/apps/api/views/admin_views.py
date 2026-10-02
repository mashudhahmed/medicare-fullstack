import csv
from calendar import monthrange
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum, Count, Avg
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.models.user import User
from apps.models.doctor import Doctor
from apps.models.patient import Patient
from apps.models.appointment import Appointment
from apps.models.billing import Billing
from apps.models.review import DoctorReview
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


class AdminAnalyticsView(APIView):
    """Executive Hospital Analytics (Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        now = timezone.now()

        # Overview summary counts
        total_users = User.objects.filter(is_deleted=False).count()
        total_patients = Patient.objects.filter(is_deleted=False).count()
        total_doctors = Doctor.objects.filter(is_deleted=False).count()
        verified_doctors = Doctor.objects.filter(is_verified=True, is_deleted=False).count()
        pending_doctors = Doctor.objects.filter(is_verified=False, is_deleted=False).count()

        total_appointments = Appointment.objects.filter(is_deleted=False).count()
        completed_appointments = Appointment.objects.filter(is_deleted=False, status='completed').count()
        confirmed_appointments = Appointment.objects.filter(is_deleted=False, status='confirmed').count()
        pending_appointments = Appointment.objects.filter(is_deleted=False, status='pending').count()
        cancelled_appointments = Appointment.objects.filter(is_deleted=False, status='cancelled').count()

        paid_revenue_val = Billing.objects.filter(is_deleted=False, status=Billing.Status.PAID).aggregate(Sum('total_amount'))['total_amount__sum'] or 0.0
        pending_revenue_val = Billing.objects.filter(is_deleted=False, status=Billing.Status.PENDING).aggregate(Sum('total_amount'))['total_amount__sum'] or 0.0

        avg_rating_val = DoctorReview.objects.filter(is_deleted=False).aggregate(Avg('rating'))['rating__avg'] or 0.0
        total_reviews_count = DoctorReview.objects.filter(is_deleted=False).count()

        # Monthly trends (last 6 calendar months)
        monthly_trends = []
        tz = timezone.get_current_timezone()
        for i in range(5, -1, -1):
            year = now.year
            month = now.month - i
            while month <= 0:
                month += 12
                year -= 1

            _, last_day = monthrange(year, month)
            start_dt = timezone.datetime(year, month, 1, 0, 0, 0, tzinfo=tz)
            end_dt = timezone.datetime(year, month, last_day, 23, 59, 59, tzinfo=tz)

            month_label = start_dt.strftime('%b %Y')
            appts_count = Appointment.objects.filter(
                is_deleted=False,
                appointment_date__gte=start_dt,
                appointment_date__lte=end_dt
            ).count()

            rev_sum = Billing.objects.filter(
                is_deleted=False,
                status=Billing.Status.PAID,
                created_at__gte=start_dt,
                created_at__lte=end_dt
            ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0.0

            monthly_trends.append({
                'month': month_label,
                'appointments': appts_count,
                'revenue': float(rev_sum)
            })

        # Specialty breakdown
        specialties = Doctor.objects.filter(is_deleted=False).values('specialty').annotate(count=Count('id')).order_by('-count')
        specialty_dict = dict(Doctor.Specialty.choices)
        specialty_distribution = [
            {
                'specialty': specialty_dict.get(item['specialty'], item['specialty'].title()),
                'key': item['specialty'],
                'count': item['count']
            }
            for item in specialties
        ]

        # Appointment status breakdown
        statuses = Appointment.objects.filter(is_deleted=False).values('status').annotate(count=Count('id'))
        status_distribution = [
            {
                'status': item['status'].capitalize(),
                'key': item['status'],
                'count': item['count']
            }
            for item in statuses
        ]

        return Response({
            'summary': {
                'total_users': total_users,
                'total_patients': total_patients,
                'total_doctors': total_doctors,
                'verified_doctors': verified_doctors,
                'pending_doctors': pending_doctors,
                'total_appointments': total_appointments,
                'completed_appointments': completed_appointments,
                'confirmed_appointments': confirmed_appointments,
                'pending_appointments': pending_appointments,
                'cancelled_appointments': cancelled_appointments,
                'total_revenue': float(paid_revenue_val),
                'pending_revenue': float(pending_revenue_val),
                'average_doctor_rating': round(float(avg_rating_val), 1),
                'total_reviews': total_reviews_count,
            },
            'monthly_trends': monthly_trends,
            'specialty_distribution': specialty_distribution,
            'status_distribution': status_distribution,
        }, status=status.HTTP_200_OK)


class ExportAppointmentsCSVView(APIView):
    """Export all appointments to CSV (Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="appointments_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Appointment ID',
            'Patient Name',
            'Patient Email',
            'Doctor Name',
            'Doctor Specialty',
            'Appointment Date & Time',
            'Duration (Minutes)',
            'Status',
            'Reason',
            'Reminder Sent',
            'Reminder Sent At',
            'Created At'
        ])

        appointments = Appointment.objects.filter(is_deleted=False).select_related(
            'patient__user', 'doctor__user'
        ).order_by('-appointment_date')

        for appt in appointments:
            writer.writerow([
                str(appt.id),
                appt.patient.user.full_name if appt.patient and appt.patient.user else '',
                appt.patient.user.email if appt.patient and appt.patient.user else '',
                appt.doctor.user.full_name if appt.doctor and appt.doctor.user else '',
                appt.doctor.get_specialty_display() if appt.doctor else '',
                appt.appointment_date.strftime('%Y-%m-%d %H:%M') if appt.appointment_date else '',
                appt.duration_minutes,
                appt.get_status_display(),
                appt.reason or '',
                'Yes' if appt.reminder_sent else 'No',
                appt.reminder_sent_at.strftime('%Y-%m-%d %H:%M:%S') if appt.reminder_sent_at else '',
                appt.created_at.strftime('%Y-%m-%d %H:%M:%S') if appt.created_at else ''
            ])

        return response


class ExportBillingCSVView(APIView):
    """Export all billing and invoices to CSV (Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="billing_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Invoice Number',
            'Patient Name',
            'Patient Email',
            'Amount',
            'Tax',
            'Discount',
            'Total Amount',
            'Status',
            'Payment Method',
            'Due Date',
            'Paid At',
            'Created At'
        ])

        billings = Billing.objects.filter(is_deleted=False).select_related(
            'patient__user'
        ).order_by('-created_at')

        for b in billings:
            writer.writerow([
                b.invoice_number,
                b.patient.user.full_name if b.patient and b.patient.user else '',
                b.patient.user.email if b.patient and b.patient.user else '',
                float(b.amount),
                float(b.tax),
                float(b.discount),
                float(b.total_amount),
                b.get_status_display(),
                b.get_payment_method_display() if b.payment_method else 'N/A',
                str(b.due_date) if b.due_date else '',
                b.paid_at.strftime('%Y-%m-%d %H:%M:%S') if b.paid_at else '',
                b.created_at.strftime('%Y-%m-%d %H:%M:%S') if b.created_at else ''
            ])

        return response


class ExportPatientsCSVView(APIView):
    """Export patient registry to CSV (Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="patients_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Patient ID',
            'Full Name',
            'Email',
            'Phone',
            'Date of Birth',
            'Gender',
            'Blood Group',
            'Emergency Contact Name',
            'Emergency Contact Phone',
            'Allergies',
            'Joined Date'
        ])

        patients = Patient.objects.filter(is_deleted=False).select_related(
            'user'
        ).order_by('-created_at')

        for p in patients:
            writer.writerow([
                str(p.id),
                p.user.full_name if p.user else '',
                p.user.email if p.user else '',
                p.user.phone if p.user else '',
                str(p.date_of_birth) if p.date_of_birth else '',
                p.get_gender_display(),
                p.blood_group or 'N/A',
                p.emergency_contact_name or '',
                p.emergency_contact or '',
                p.allergies or '',
                p.created_at.strftime('%Y-%m-%d %H:%M:%S') if p.created_at else ''
            ])

        return response


class ExportDoctorsCSVView(APIView):
    """Export doctors list to CSV (Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="doctors_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Doctor ID',
            'Full Name',
            'Email',
            'Phone',
            'Specialty',
            'Qualification',
            'License Number',
            'Experience (Years)',
            'Consultation Fee',
            'Verified',
            'Average Rating',
            'Total Reviews',
            'Joined Date'
        ])

        doctors = Doctor.objects.filter(is_deleted=False).select_related(
            'user'
        ).order_by('-created_at')

        for d in doctors:
            writer.writerow([
                str(d.id),
                d.user.full_name if d.user else '',
                d.user.email if d.user else '',
                d.user.phone if d.user else '',
                d.get_specialty_display(),
                d.qualification,
                d.license_number,
                d.experience_years,
                float(d.consultation_fee),
                'Yes' if d.is_verified else 'No',
                d.average_rating,
                d.total_reviews,
                d.created_at.strftime('%Y-%m-%d %H:%M:%S') if d.created_at else ''
            ])

        return response
