from rest_framework import serializers
from apps.models.patient import Patient
from .user_schema import UserSerializer


class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'full_name', 'email',
            'date_of_birth', 'gender', 'blood_group',
            'emergency_contact', 'emergency_contact_name',
            'allergies', 'chronic_conditions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CreatePatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            'date_of_birth', 'gender', 'blood_group',
            'emergency_contact', 'emergency_contact_name',
            'allergies', 'chronic_conditions'
        ]