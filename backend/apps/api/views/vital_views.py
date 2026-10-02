from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.models.vital import PatientVital
from apps.models.patient import Patient
from apps.schemas.vital_schema import PatientVitalSerializer, CreatePatientVitalSerializer
from apps.utils.audit import log_audit


class ListCreateVitalsView(generics.ListCreateAPIView):
    """List vitals or log a new vital sign record"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = PatientVital.objects.filter(is_deleted=False).select_related(
            'patient__user', 'recorded_by'
        )

        patient_id = self.request.query_params.get('patient')

        if user.role == 'patient':
            try:
                patient = user.patient_profile
                return queryset.filter(patient=patient)
            except Exception:
                return PatientVital.objects.none()
        elif user.role in ['doctor', 'admin']:
            if patient_id:
                return queryset.filter(patient_id=patient_id)
            return queryset
        return PatientVital.objects.none()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreatePatientVitalSerializer
        return PatientVitalSerializer

    def perform_create(self, serializer):
        user = self.request.user
        patient = None

        if user.role == 'patient':
            try:
                patient = user.patient_profile
            except Exception:
                raise ValidationError("Patient profile required to log vitals.")
        elif user.role in ['doctor', 'admin']:
            patient = serializer.validated_data.get('patient')
            if not patient:
                raise ValidationError({"patient": "Patient is required when doctor or admin records vitals."})
        else:
            raise PermissionDenied("Only patients, doctors, or administrators can record vitals.")

        vital = serializer.save(patient=patient, recorded_by=user)

        log_audit(
            request=self.request,
            action='CREATE',
            resource_type='PatientVital',
            resource_id=str(vital.id),
            user=user,
            details={
                'patient_id': str(patient.id),
                'bp': vital.bp_reading,
                'heart_rate': vital.heart_rate,
                'blood_glucose': str(vital.blood_glucose) if vital.blood_glucose else None,
                'bmi': str(vital.bmi) if vital.bmi else None,
            }
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        full_serializer = PatientVitalSerializer(serializer.instance)
        headers = self.get_success_headers(full_serializer.data)
        return Response(full_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class VitalDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or soft-delete a vital record"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PatientVitalSerializer
    queryset = PatientVital.objects.filter(is_deleted=False).select_related('patient__user', 'recorded_by')

    def perform_update(self, serializer):
        vital = self.get_object()
        user = self.request.user
        if user.role == 'patient' and vital.patient.user != user:
            raise PermissionDenied("You can only edit your own vitals records.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == 'patient' and instance.patient.user != user:
            raise PermissionDenied("You can only delete your own vitals records.")
        instance.soft_delete()


class PatientVitalsHistoryView(generics.ListAPIView):
    """Get historical vitals for a specific patient (for interactive health charts)"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PatientVitalSerializer

    def get_queryset(self):
        user = self.request.user
        patient_id = self.kwargs.get('patient_id')

        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return PatientVital.objects.none()

        if user.role == 'patient' and patient.user != user:
            raise PermissionDenied("You cannot view vitals of another patient.")

        return PatientVital.objects.filter(
            patient=patient, is_deleted=False
        ).select_related('patient__user', 'recorded_by').order_by('recorded_at')
