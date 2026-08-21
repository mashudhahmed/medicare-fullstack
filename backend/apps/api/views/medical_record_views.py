from rest_framework import generics, permissions, status
from rest_framework.response import Response
from apps.models.medical_record import MedicalRecord
from apps.schemas.medical_record_schema import MedicalRecordSerializer, CreateMedicalRecordSerializer
from apps.core.permissions import IsAdmin, IsDoctor


class ListCreateMedicalRecordsView(generics.ListCreateAPIView):
    """List all medical records or create new"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return MedicalRecord.objects.filter(is_deleted=False)
        elif user.role == 'doctor':
            return MedicalRecord.objects.filter(doctor__user=user, is_deleted=False)
        elif user.role == 'patient':
            return MedicalRecord.objects.filter(patient__user=user, is_deleted=False)
        return MedicalRecord.objects.none()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateMedicalRecordSerializer
        return MedicalRecordSerializer

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'doctor':
            serializer.save(doctor=user.doctor_profile)
        else:
            serializer.save()


class MedicalRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, delete medical record"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MedicalRecordSerializer
    queryset = MedicalRecord.objects.filter(is_deleted=False)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        return Response({
            'message': 'Medical record deleted successfully'
        }, status=status.HTTP_200_OK)


class MyMedicalRecordsView(generics.ListAPIView):
    """Get current user's medical records"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MedicalRecordSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return MedicalRecord.objects.filter(patient__user=user, is_deleted=False)
        elif user.role == 'doctor':
            return MedicalRecord.objects.filter(doctor__user=user, is_deleted=False)
        return MedicalRecord.objects.none()


class PatientMedicalRecordsView(generics.ListAPIView):
    """Get medical records for a specific patient (Doctor/Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsDoctor | IsAdmin]
    serializer_class = MedicalRecordSerializer

    def get_queryset(self):
        patient_id = self.kwargs.get('patient_id')
        return MedicalRecord.objects.filter(
            patient_id=patient_id,
            is_deleted=False
        )