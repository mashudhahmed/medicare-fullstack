from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from apps.models.models import Invoice, Payment
from apps.schemas import InvoiceSerializer, PaymentSerializer

class InvoiceListCreateView(generics.ListCreateAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_patient:
            return Invoice.objects.filter(patient=user.patient_profile)
        elif user.is_doctor:
            return Invoice.objects.filter(appointment__doctor=user.doctor_profile)
        else:
            return Invoice.objects.all()

class InvoiceDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_patient:
            return Invoice.objects.filter(patient=user.patient_profile)
        elif user.is_doctor:
            return Invoice.objects.filter(appointment__doctor=user.doctor_profile)
        else:
            return Invoice.objects.all()

class PaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_patient:
            return Payment.objects.filter(patient=user.patient_profile)
        elif user.is_doctor:
            return Payment.objects.filter(invoice__appointment__doctor=user.doctor_profile)
        else:
            return Payment.objects.all()
    
    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(patient=user.patient_profile)

class PaymentDetailView(generics.RetrieveAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_patient:
            return Payment.objects.filter(patient=user.patient_profile)
        elif user.is_doctor:
            return Payment.objects.filter(invoice__appointment__doctor=user.doctor_profile)
        else:
            return Payment.objects.all()
