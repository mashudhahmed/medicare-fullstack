from rest_framework import serializers
from apps.models.vital import PatientVital


class PatientVitalSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)
    bp_reading = serializers.SerializerMethodField()

    class Meta:
        model = PatientVital
        fields = [
            'id',
            'patient',
            'patient_name',
            'recorded_by',
            'recorded_by_name',
            'systolic_bp',
            'diastolic_bp',
            'bp_reading',
            'heart_rate',
            'blood_glucose',
            'glucose_context',
            'body_temperature',
            'oxygen_saturation',
            'weight_kg',
            'height_cm',
            'bmi',
            'bmi_category',
            'notes',
            'recorded_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'patient', 'recorded_by', 'bmi', 'bmi_category', 'created_at', 'updated_at']

    def get_bp_reading(self, obj):
        if obj.systolic_bp and obj.diastolic_bp:
            return f"{obj.systolic_bp}/{obj.diastolic_bp}"
        return None


class CreatePatientVitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientVital
        fields = [
            'patient',
            'systolic_bp',
            'diastolic_bp',
            'heart_rate',
            'blood_glucose',
            'glucose_context',
            'body_temperature',
            'oxygen_saturation',
            'weight_kg',
            'height_cm',
            'notes',
            'recorded_at',
        ]
        extra_kwargs = {
            'patient': {'required': False}
        }
