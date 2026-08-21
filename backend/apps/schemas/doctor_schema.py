from rest_framework import serializers
from apps.models.models import Doctor, DoctorAvailability
from .user_schema import UserSerializer

class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_display', read_only=True)
    
    class Meta:
        model = DoctorAvailability
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("Start time must be before end time.")
        return data

class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    availabilities = DoctorAvailabilitySerializer(many=True, read_only=True)
    
    class Meta:
        model = Doctor
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'rating', 'total_reviews', 'is_approved')

class DoctorCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        exclude = ('user', 'created_at', 'updated_at', 'rating', 'total_reviews', 'is_approved')

class DoctorUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ('specialization', 'qualifications', 'experience_years', 
                 'consultation_fee', 'about', 'is_available')

class DoctorApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ('is_approved',)
