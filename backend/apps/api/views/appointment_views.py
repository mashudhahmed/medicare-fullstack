from datetime import datetime, timedelta, time as dt_time
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.models.appointment import Appointment
from apps.models.doctor import Doctor
from apps.schemas.appointment_schema import AppointmentSerializer, CreateAppointmentSerializer
from apps.core.permissions import IsPatient, IsDoctor, IsAdmin


class ListCreateAppointmentsView(generics.ListCreateAPIView):
    """List all appointments or create new"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Appointment.objects.filter(is_deleted=False)
        elif user.role == 'patient':
            return Appointment.objects.filter(patient__user=user, is_deleted=False)
        elif user.role == 'doctor':
            return Appointment.objects.filter(doctor__user=user, is_deleted=False)
        return Appointment.objects.none()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateAppointmentSerializer
        return AppointmentSerializer

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'patient':
            patient = user.patient_profile
            serializer.save(patient=patient, status='pending')
        else:
            serializer.save(status='pending')


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, delete appointment"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer
    queryset = Appointment.objects.filter(is_deleted=False)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        return Response({
            'message': 'Appointment deleted successfully'
        }, status=status.HTTP_200_OK)


class CancelAppointmentView(APIView):
    """Cancel an appointment"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(id=pk, is_deleted=False)
        except Appointment.DoesNotExist:
            return Response({
                'error': 'Appointment not found'
            }, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role not in ['patient', 'doctor', 'admin']:
            return Response({
                'error': 'You cannot cancel this appointment'
            }, status=status.HTTP_403_FORBIDDEN)

        # Ownership check for non-admins
        if user.role == 'patient' and appointment.patient.user_id != user.id:
            return Response({'error': 'Not your appointment'}, status=status.HTTP_403_FORBIDDEN)
        if user.role == 'doctor' and appointment.doctor.user_id != user.id:
            return Response({'error': 'Not your appointment'}, status=status.HTTP_403_FORBIDDEN)

        if appointment.status in ['completed', 'cancelled', 'no_show']:
            return Response({
                'error': f'Cannot cancel appointment with status: {appointment.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        appointment.status = 'cancelled'
        appointment.save()

        return Response({
            'message': 'Appointment cancelled successfully'
        }, status=status.HTTP_200_OK)


class MyAppointmentsView(generics.ListAPIView):
    """Get current user's appointments"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return Appointment.objects.filter(patient__user=user, is_deleted=False)
        elif user.role == 'doctor':
            return Appointment.objects.filter(doctor__user=user, is_deleted=False)
        elif user.role == 'admin':
            return Appointment.objects.filter(is_deleted=False)
        return Appointment.objects.none()


class AvailableSlotsView(APIView):
    """
    Return available time slots for a doctor on a given date.
    Query param: ?date=YYYY-MM-DD  (defaults to today)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, doctor_id):
        try:
            doctor = Doctor.objects.get(id=doctor_id, is_deleted=False, is_verified=True)
        except Doctor.DoesNotExist:
            return Response(
                {'error': 'Doctor not found or not verified'},
                status=status.HTTP_404_NOT_FOUND
            )

        date_str = request.query_params.get('date')
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            target_date = timezone.localdate()

        # Respect doctor's available_days if set
        available_days = doctor.available_days or []
        if available_days:
            weekday_name = target_date.strftime('%A').lower()
            weekday_num = target_date.weekday()  # 0=Mon
            day_ok = (
                weekday_name in [d.lower() for d in available_days if isinstance(d, str)]
                or weekday_num in [d for d in available_days if isinstance(d, int)]
                or str(weekday_num) in [str(d) for d in available_days]
            )
            if not day_ok:
                return Response({
                    'doctor_id': str(doctor.id),
                    'date': target_date.isoformat(),
                    'slots': [],
                    'message': 'Doctor is not available on this day',
                })

        start_t = doctor.available_time_start or dt_time(9, 0)
        end_t = doctor.available_time_end or dt_time(17, 0)
        slot_minutes = 30

        slots = []
        current = datetime.combine(target_date, start_t)
        end_dt = datetime.combine(target_date, end_t)
        if timezone.is_aware(timezone.now()):
            current = timezone.make_aware(current)
            end_dt = timezone.make_aware(end_dt)

        booked = set(
            Appointment.objects.filter(
                doctor=doctor,
                is_deleted=False,
                status__in=['pending', 'confirmed', 'in_progress'],
                appointment_date__date=target_date,
            ).values_list('appointment_date', flat=True)
        )

        now = timezone.now()
        while current + timedelta(minutes=slot_minutes) <= end_dt:
            if current >= now and current not in booked:
                slots.append(current.isoformat())
            current += timedelta(minutes=slot_minutes)

        return Response({
            'doctor_id': str(doctor.id),
            'date': target_date.isoformat(),
            'slots': slots,
        })
