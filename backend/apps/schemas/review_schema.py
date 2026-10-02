from rest_framework import serializers
from apps.models.review import DoctorReview


class DoctorReviewSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_avatar = serializers.SerializerMethodField()
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)

    class Meta:
        model = DoctorReview
        fields = [
            'id',
            'doctor',
            'patient',
            'appointment',
            'rating',
            'comment',
            'patient_name',
            'patient_avatar',
            'doctor_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'patient', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        if obj.patient and obj.patient.user:
            return obj.patient.user.get_full_name() or obj.patient.user.email
        return "Verified Patient"

    def get_patient_avatar(self, obj):
        if obj.patient and obj.patient.user:
            return obj.patient.user.profile_picture or ""
        return ""


class CreateDoctorReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorReview
        fields = ['doctor', 'appointment', 'rating', 'comment']

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5 stars.")
        return value
