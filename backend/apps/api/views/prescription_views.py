from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.models.prescription import Prescription
from apps.schemas.prescription_schema import PrescriptionSerializer, CreatePrescriptionSerializer
from apps.core.permissions import IsDoctor, IsPatient
from apps.services.notification_service import NotificationService
from apps.utils.audit import log_audit


class ListCreatePrescriptionView(generics.ListCreateAPIView):
    """List all prescriptions or doctor creates a new prescription"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Prescription.objects.filter(is_deleted=False)
        elif user.role == 'doctor':
            return Prescription.objects.filter(doctor__user=user, is_deleted=False)
        elif user.role == 'patient':
            return Prescription.objects.filter(patient__user=user, is_deleted=False)
        return Prescription.objects.none()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreatePrescriptionSerializer
        return PrescriptionSerializer

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'doctor':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only doctors can issue prescriptions.")

        doctor = user.doctor_profile
        prescription = serializer.save(doctor=doctor)

        log_audit(
            request=self.request,
            action='CREATE',
            resource_type='Prescription',
            resource_id=prescription.id,
            details={'medication': prescription.medication_name, 'patient_id': str(prescription.patient.id)}
        )

        NotificationService.send_user_notification(
            user=prescription.patient.user,
            title="New Prescription Issued",
            message=f"Dr. {user.get_full_name()} has prescribed {prescription.medication_name} ({prescription.dosage}).",
            category="MEDICAL"
        )


class PrescriptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or soft-delete a prescription"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PrescriptionSerializer
    queryset = Prescription.objects.filter(is_deleted=False)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        log_audit(
            request=request,
            action='DELETE',
            resource_type='Prescription',
            resource_id=instance.id
        )
        return Response({'message': 'Prescription deleted successfully'}, status=status.HTTP_200_OK)


class MyPrescriptionsView(generics.ListAPIView):
    """Get active user's prescriptions"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return Prescription.objects.filter(patient__user=user, is_deleted=False)
        elif user.role == 'doctor':
            return Prescription.objects.filter(doctor__user=user, is_deleted=False)
        return Prescription.objects.none()


class RefillPrescriptionView(APIView):
    """Patient requests a refill for an active prescription"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            prescription = Prescription.objects.get(id=pk, is_deleted=False)
        except Prescription.DoesNotExist:
            return Response({'error': 'Prescription not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'patient' and prescription.patient.user != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        if not prescription.can_refill():
            return Response({
                'error': f'Cannot refill prescription. Refills used: {prescription.refills_used}/{prescription.refills_allowed}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        prescription.refills_used += 1
        if prescription.refills_used >= prescription.refills_allowed:
            prescription.status = Prescription.Status.COMPLETED
        prescription.save()

        log_audit(
            request=request,
            action='UPDATE',
            resource_type='Prescription',
            resource_id=prescription.id,
            details={'action': 'refill_requested', 'refills_used': prescription.refills_used}
        )

        NotificationService.send_user_notification(
            user=prescription.doctor.user,
            title="Prescription Refill Requested",
            message=f"Patient {prescription.patient.user.get_full_name()} requested a refill for {prescription.medication_name}.",
            category="MEDICAL"
        )

        return Response({
            'message': 'Refill processed successfully',
            'prescription': PrescriptionSerializer(prescription).data
        }, status=status.HTTP_200_OK)
