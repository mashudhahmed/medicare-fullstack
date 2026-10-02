from rest_framework import serializers
from apps.models.medical_record import MedicalRecord
from .patient_schema import PatientSerializer
from .doctor_schema import DoctorSerializer


class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_details = DoctorSerializer(source='doctor', read_only=True)

    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'patient', 'patient_details', 'doctor', 'doctor_details',
            'record_type', 'title', 'description',
            'details', 'attachments', 'attachment_file',
            'record_date', 'is_confidential',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.attachment_file:
            val = str(instance.attachment_file)
            if val.startswith('http://') or val.startswith('https://'):
                data['attachment_file'] = val
        return data


class CreateMedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = [
            'patient', 'record_type', 'title', 'description',
            'details', 'attachments', 'attachment_file',
            'record_date', 'is_confidential'
        ]