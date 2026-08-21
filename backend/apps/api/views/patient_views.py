from rest_framework import generics, permissions, status
from rest_framework.response import Response
from apps.models.patient import Patient
from apps.schemas.patient_schema import PatientSerializer
from apps.core.permissions import IsPatient, IsAdmin, IsOwnerOrAdmin


class ListPatientsView(generics.ListAPIView):
    """List all patients (Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = PatientSerializer
    queryset = Patient.objects.filter(is_deleted=False)


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, delete patient"""
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    serializer_class = PatientSerializer
    queryset = Patient.objects.filter(is_deleted=False)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        return Response({
            'message': 'Patient record deleted successfully'
        }, status=status.HTTP_200_OK)


class MyPatientProfileView(generics.RetrieveUpdateAPIView):
    """Get or update current patient's profile"""
    permission_classes = [permissions.IsAuthenticated, IsPatient]
    serializer_class = PatientSerializer

    def get_object(self):
        return self.request.user.patient_profile