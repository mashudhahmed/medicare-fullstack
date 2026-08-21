from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from apps.models.models import Doctor, DoctorAvailability
from apps.schemas import DoctorSerializer, DoctorAvailabilitySerializer

class DoctorListView(generics.ListAPIView):
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Doctor.objects.filter(is_approved=True)
        
        # Filter by specialization
        specialization = self.request.query_params.get('specialization')
        if specialization:
            queryset = queryset.filter(specialization__icontains=specialization)
        
        # Filter by availability
        is_available = self.request.query_params.get('is_available')
        if is_available:
            queryset = queryset.filter(is_available=True)
        
        return queryset

class DoctorDetailView(generics.RetrieveAPIView):
    serializer_class = DoctorSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Doctor.objects.filter(is_approved=True)

class DoctorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user.doctor_profile

class DoctorAvailabilityView(generics.ListCreateAPIView):
    serializer_class = DoctorAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DoctorAvailability.objects.filter(doctor=self.request.user.doctor_profile)
    
    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user.doctor_profile)

class DoctorAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DoctorAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DoctorAvailability.objects.filter(doctor=self.request.user.doctor_profile)
