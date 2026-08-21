from rest_framework import serializers
from apps.models.appointment import Appointment
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
            'reason', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CreateAppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'doctor', 'appointment_date', 'duration_minutes',
            'reason', 'notes'
        ]