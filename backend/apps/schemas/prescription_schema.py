from rest_framework import serializers
from apps.models.prescription import Prescription
from apps.models.patient import Patient
from apps.models.doctor import Doctor


class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    doctor_specialty = serializers.CharField(source='doctor.specialty', read_only=True)
    can_refill = serializers.BooleanField(read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id',
            'patient',
            'patient_name',
            'doctor',
            'doctor_name',
            'doctor_specialty',
            'appointment',
            'medication_name',
            'dosage',
            'frequency',
            'duration_days',
            'instructions',
            'refills_allowed',
            'refills_used',
            'can_refill',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'refills_used']


class CreatePrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = [
            'patient',
            'appointment',
            'medication_name',
            'dosage',
            'frequency',
            'duration_days',
            'instructions',
            'refills_allowed',
        ]
