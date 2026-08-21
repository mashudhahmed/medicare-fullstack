from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta
from apps.models.models import Appointment, Doctor
from apps.schemas import AppointmentSerializer, AppointmentCreateSerializer

class AppointmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppointmentCreateSerializer
        return AppointmentSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_patient:
            return Appointment.objects.filter(patient=user.patient_profile)
        elif user.is_doctor:
            return Appointment.objects.filter(doctor=user.doctor_profile)
        else:
            return Appointment.objects.all()
    
    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(patient=user.patient_profile)

class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_patient:
            return Appointment.objects.filter(patient=user.patient_profile)
        elif user.is_doctor:
            return Appointment.objects.filter(doctor=user.doctor_profile)
        else:
            return Appointment.objects.all()

class AppointmentCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
            
            user = request.user
            if not (user.is_admin_user or 
                    (user.is_patient and appointment.patient.user == user) or
                    (user.is_doctor and appointment.doctor.user == user)):
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
            if appointment.status in ['completed', 'cancelled']:
                return Response({'error': 'Cannot cancel this appointment'}, status=status.HTTP_400_BAD_REQUEST)
            
            appointment.status = 'cancelled'
            appointment.cancellation_reason = request.data.get('reason', 'Cancelled by user')
            appointment.save()
            
            return Response({'message': 'Appointment cancelled successfully'})
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)

class AvailableSlotsView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, doctor_id):
        try:
            doctor = Doctor.objects.get(id=doctor_id)
            date_str = request.query_params.get('date')
            
            if not date_str:
                return Response({'error': 'Date is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            day = date.weekday()
            
            availabilities = doctor.availabilities.filter(day=day, is_active=True)
            
            if not availabilities.exists():
                return Response({'slots': []})
            
            slots = []
            for availability in availabilities:
                current = availability.start_time
                while current < availability.end_time:
                    is_booked = Appointment.objects.filter(
                        doctor=doctor,
                        date=date,
                        start_time=current,
                        status__in=['pending', 'confirmed', 'in_progress']
                    ).exists()
                    
                    if not is_booked:
                        slots.append(current.strftime('%H:%M'))
                    
                    current = (datetime.combine(datetime.today(), current) + 
                              timedelta(minutes=availability.slot_duration)).time()
            
            return Response({'slots': slots})
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=status.HTTP_404_NOT_FOUND)
