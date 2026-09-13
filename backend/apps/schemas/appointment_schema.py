from rest_framework import serializers
from apps.models.appointment import Appointment
from apps.models.doctor import Doctor
from django.utils import timezone
from datetime import timedelta
from .patient_schema import PatientSerializer
from .doctor_schema import DoctorSerializer


class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_details = DoctorSerializer(source='doctor', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_details', 'doctor', 'doctor_details',
            'appointment_date', 'duration_minutes', 'status',
            'reason', 'notes', 'video_room_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'video_room_id', 'created_at', 'updated_at']


class CreateAppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['doctor', 'appointment_date', 'duration_minutes', 'reason', 'notes']

    def validate_doctor(self, doctor):
        """Validate that the doctor is verified and available"""
        if not doctor.is_verified:
            raise serializers.ValidationError("This doctor is not verified yet.")
        if doctor.is_deleted:
            raise serializers.ValidationError("This doctor is no longer available.")
        return doctor

    def validate_appointment_date(self, value):
        """Validate that appointment is in the future"""
        if value <= timezone.now():
            raise serializers.ValidationError("Appointment date must be in the future.")
        return value

    def validate(self, attrs):
        """Validate that the time slot is available (no double booking)"""
        doctor = attrs.get('doctor')
        appointment_date = attrs.get('appointment_date')
        duration = attrs.get('duration_minutes', 30)

        # Calculate end time
        end_time = appointment_date + timedelta(minutes=duration)

        # Check for overlapping appointments with the same doctor
        overlapping = Appointment.objects.filter(
            doctor=doctor,
            status__in=['pending', 'confirmed', 'in_progress'],
            appointment_date__lt=end_time,
            appointment_date__gte=appointment_date - timedelta(minutes=duration)
        ).exists()

        if overlapping:
            raise serializers.ValidationError(
                "This time slot is already booked. Please choose another time."
            )

        return attrs

    def create(self, validated_data):
        """Create appointment with pending status"""
        validated_data['status'] = 'pending'
        return super().create(validated_data)