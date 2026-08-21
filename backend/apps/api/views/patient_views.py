from rest_framework import generics, permissions
from apps.models.models import Patient
from apps.schemas import PatientSerializer

class PatientProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user.patient_profile
