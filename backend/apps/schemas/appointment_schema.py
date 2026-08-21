from rest_framework import serializers
from django.utils import timezone
from apps.models.models import Appointment
from .patient_schema import PatientSerializer
from .doctor_schema import DoctorSerializer

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    patient = PatientSerializer(read_only=True)
    doctor = DoctorSerializer(read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    mode_display = serializers.CharField(source='get_mode_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'end_time', 'meeting_link')

class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ('doctor', 'date', 'start_time', 'mode', 'reason')
    
    def validate(self, data):
        doctor = data.get('doctor')
        date = data.get('date')
        start_time = data.get('start_time')
        
        # Check if date is in the past
        if date < timezone.now().date():
            raise serializers.ValidationError("Cannot book appointment in the past.")
        
        # Check if start_time is in the past for today
        if date == timezone.now().date() and start_time < timezone.now().time():
            raise serializers.ValidationError("Cannot book appointment in the past.")
        
        # Check for overlapping appointments
        overlapping = Appointment.objects.filter(
            doctor=doctor,
            date=date,
            start_time=start_time,
            status__in=['pending', 'confirmed', 'in_progress']
        ).exclude(id=self.instance.id if self.instance else None)
        
        if overlapping.exists():
            raise serializers.ValidationError("Doctor is not available at this time.")
        
        # Calculate end time (default 30 minutes)
        from datetime import datetime, timedelta
        end_time = (datetime.combine(datetime.today(), start_time) + timedelta(minutes=30)).time()
        data['end_time'] = end_time
        
        return data

class AppointmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ('date', 'start_time', 'end_time', 'mode', 'reason', 'notes', 'status')
    
    def validate(self, data):
        if 'status' in data and data['status'] in ['completed', 'cancelled']:
            # Check if appointment is already completed or cancelled
            if self.instance and self.instance.status in ['completed', 'cancelled']:
                raise serializers.ValidationError("Cannot update a completed or cancelled appointment.")
        return data

class AppointmentRescheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ('date', 'start_time')
    
    def validate(self, data):
        doctor = self.instance.doctor
        date = data.get('date')
        start_time = data.get('start_time')
        
        # Check if date is in the past
        if date < timezone.now().date():
            raise serializers.ValidationError("Cannot reschedule to a past date.")
        
        # Check for overlapping appointments
        overlapping = Appointment.objects.filter(
            doctor=doctor,
            date=date,
            start_time=start_time,
            status__in=['pending', 'confirmed', 'in_progress']
        ).exclude(id=self.instance.id)
        
        if overlapping.exists():
            raise serializers.ValidationError("Doctor is not available at this time.")
        
        from datetime import datetime, timedelta
        end_time = (datetime.combine(datetime.today(), start_time) + timedelta(minutes=30)).time()
        data['end_time'] = end_time
        
        return data
