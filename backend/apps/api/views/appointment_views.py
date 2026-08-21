from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.models.appointment import Appointment
from apps.schemas.appointment_schema import AppointmentSerializer, CreateAppointmentSerializer
from apps.core.permissions import IsPatient, IsDoctor, IsAdmin


class ListCreateAppointmentsView(generics.ListCreateAPIView):
    """List all appointments or create new (Admin only for list)"""
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