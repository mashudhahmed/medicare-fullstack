from rest_framework import serializers
from apps.models.doctor import Doctor
from .user_schema import UserSerializer


class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    total_reviews = serializers.IntegerField(read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'user', 'full_name', 'email',
            'specialty', 'qualification', 'experience_years',
            'license_number', 'is_verified', 'consultation_fee',
            'available_days', 'available_time_start', 'available_time_end',
            'average_rating', 'total_reviews',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_verified', 'average_rating', 'total_reviews']


class CreateDoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = [
            'specialty', 'qualification', 'experience_years',
            'license_number', 'consultation_fee',
            'available_days', 'available_time_start', 'available_time_end'
        ]