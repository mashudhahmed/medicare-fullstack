from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from apps.models.patient import Patient
from apps.schemas.patient_schema import PatientSerializer
from apps.core.permissions import IsPatient, IsDoctor, IsAdmin, IsOwnerOrAdmin, IsOwnerOrDoctorOrAdmin


class ListPatientsView(generics.ListAPIView):
    """List all patients with search and demographic filters (Admin & Doctor)"""
    permission_classes = [permissions.IsAuthenticated, IsDoctor]
    serializer_class = PatientSerializer

    def get_queryset(self):
        queryset = Patient.objects.filter(is_deleted=False).select_related('user').order_by('-created_at')
        search = self.request.query_params.get('search')
        gender = self.request.query_params.get('gender')
        blood_group = self.request.query_params.get('blood_group')

        if gender and gender != 'all':
            queryset = queryset.filter(gender=gender)
        if blood_group and blood_group != 'all':
            queryset = queryset.filter(blood_group=blood_group)
        if search:
            queryset = queryset.filter(
                Q(user__full_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__phone__icontains=search) |
                Q(blood_group__icontains=search)
            )
        return queryset


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get (owner, doctor, admin), update, delete patient (owner or admin)"""
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrDoctorOrAdmin]
    serializer_class = PatientSerializer
    queryset = Patient.objects.filter(is_deleted=False).select_related('user')

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