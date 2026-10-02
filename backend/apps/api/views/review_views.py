from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.models.review import DoctorReview
from apps.models.doctor import Doctor
from apps.schemas.review_schema import DoctorReviewSerializer, CreateDoctorReviewSerializer
from apps.services.notification_service import NotificationService
from apps.utils.audit import log_audit


class ListCreateReviewView(generics.ListCreateAPIView):
    """List reviews or patient creates a new review for a doctor"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = DoctorReview.objects.filter(is_deleted=False).select_related(
            'doctor__user', 'patient__user', 'appointment'
        )
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        return queryset

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateDoctorReviewSerializer
        return DoctorReviewSerializer

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'patient':
            raise PermissionDenied("Only registered patients can submit reviews.")

        try:
            patient = user.patient_profile
        except Exception:
            raise ValidationError("Patient profile required to submit a review.")

        doctor = serializer.validated_data.get('doctor')
        appointment = serializer.validated_data.get('appointment')

        # If appointment is provided, verify it belongs to this patient
        if appointment and appointment.patient != patient:
            raise PermissionDenied("You can only review appointments booked under your account.")

        review = serializer.save(patient=patient)

        # Audit log
        log_audit(
            request=self.request,
            action='CREATE',
            resource_type='DoctorReview',
            resource_id=str(review.id),
            user=user,
            details={
                'doctor_id': str(doctor.id),
                'rating': review.rating,
                'doctor_name': doctor.user.get_full_name()
            }
        )

        # Notify the doctor
        NotificationService.send_user_notification(
            user=doctor.user,
            title="New Patient Review",
            message=f"{patient.user.get_full_name()} rated you {review.rating}★: \"{review.comment[:60]}...\"",
            category="MEDICAL"
        )


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or soft-delete a review"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DoctorReviewSerializer
    queryset = DoctorReview.objects.filter(is_deleted=False).select_related('doctor__user', 'patient__user')

    def perform_update(self, serializer):
        review = self.get_object()
        if review.patient.user != self.request.user and self.request.user.role != 'admin':
            raise PermissionDenied("You can only edit your own reviews.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.patient.user != self.request.user and self.request.user.role != 'admin':
            raise PermissionDenied("You can only delete your own reviews.")
        instance.soft_delete()


class DoctorReviewsView(generics.ListAPIView):
    """Public/Authenticated endpoint to view all reviews for a specific doctor"""
    permission_classes = [permissions.AllowAny]
    serializer_class = DoctorReviewSerializer

    def get_queryset(self):
        doctor_id = self.kwargs.get('doctor_id')
        return DoctorReview.objects.filter(
            doctor_id=doctor_id, is_deleted=False
        ).select_related('patient__user', 'doctor__user').order_by('-created_at')
