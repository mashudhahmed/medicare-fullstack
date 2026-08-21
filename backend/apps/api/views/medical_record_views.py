from rest_framework import generics, permissions
from apps.models.models import MedicalRecord, Prescription
from apps.schemas import MedicalRecordSerializer, PrescriptionSerializer

class MedicalRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_patient:
            return MedicalRecord.objects.filter(patient=user.patient_profile)
        elif user.is_doctor:
            return MedicalRecord.objects.filter(doctor=user.doctor_profile)
        else:
            return MedicalRecord.objects.all()
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.is_doctor:
            serializer.save(
                patient_id=self.request.data.get('patient'),
                doctor=user.doctor_profile
            )
        else:
            serializer.save(
                patient=user.patient_profile,
                doctor_id=self.request.data.get('doctor')
            )

class MedicalRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_patient:
            return MedicalRecord.objects.filter(patient=user.patient_profile)
        elif user.is_doctor:
            return MedicalRecord.objects.filter(doctor=user.doctor_profile)
        else:
            return MedicalRecord.objects.all()

class PrescriptionListCreateView(generics.ListCreateAPIView):
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_patient:
            return Prescription.objects.filter(patient=user.patient_profile)
        elif user.is_doctor:
            return Prescription.objects.filter(doctor=user.doctor_profile)
        else:
            return Prescription.objects.all()
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.is_doctor:
            serializer.save(
                patient_id=self.request.data.get('patient'),
                doctor=user.doctor_profile
            )
        else:
            serializer.save(
                patient=user.patient_profile,
                doctor_id=self.request.data.get('doctor')
            )

class PrescriptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_patient:
            return Prescription.objects.filter(patient=user.patient_profile)
        elif user.is_doctor:
            return Prescription.objects.filter(doctor=user.doctor_profile)
        else:
            return Prescription.objects.all()
