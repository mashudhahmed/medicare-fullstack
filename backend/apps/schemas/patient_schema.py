from rest_framework import serializers
from apps.models.models import Patient
from .user_schema import UserSerializer

class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
    
    def get_age(self, obj):
        from datetime import date
        if obj.user.date_of_birth:
            today = date.today()
            return today.year - obj.user.date_of_birth.year - (
                (today.month, today.day) < (obj.user.date_of_birth.month, obj.user.date_of_birth.day)
            )
        return None

class PatientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        exclude = ('user', 'created_at', 'updated_at')

class PatientUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ('gender', 'blood_group', 'height', 'weight', 'allergies', 
                 'chronic_conditions', 'current_medications', 'emergency_contact_name',
                 'emergency_contact_phone', 'emergency_contact_relation', 
                 'insurance_provider', 'insurance_policy_number')
