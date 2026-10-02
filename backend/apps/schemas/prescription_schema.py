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
            'has_safety_warning',
            'safety_alerts',
            'override_reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'refills_used', 'has_safety_warning', 'safety_alerts']


class CreatePrescriptionSerializer(serializers.ModelSerializer):
    acknowledge_warnings = serializers.BooleanField(default=False, required=False, write_only=True)
    override_reason = serializers.CharField(required=False, allow_blank=True, default='')

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
            'acknowledge_warnings',
            'override_reason',
        ]

    def create(self, validated_data):
        validated_data.pop('acknowledge_warnings', None)
        return super().create(validated_data)


class DrugSafetyCheckSerializer(serializers.Serializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.filter(is_deleted=False))
    medication_name = serializers.CharField(max_length=255)

