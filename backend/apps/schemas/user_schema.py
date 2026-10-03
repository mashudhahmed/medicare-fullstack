from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from apps.models.user import User


class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'address',
            'profile_picture', 'profile_picture_public_id', 'role', 'status', 'two_factor_enabled',
            'last_login', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_login', 'created_at', 'updated_at', 'two_factor_enabled', 'profile_picture_public_id']

    def get_profile_picture(self, obj):
        if not obj.profile_picture:
            return None
        url_str = str(obj.profile_picture).strip()
        if not url_str or url_str == 'None':
            return None

        # Return full remote CDN URL directly (e.g. Cloudinary)
        if url_str.startswith('http://') or url_str.startswith('https://'):
            return url_str

        # Clean duplicate media paths if present
        while url_str.startswith('/media/media/'):
            url_str = url_str.replace('/media/media/', '/media/', 1)
        if url_str.startswith('media/'):
            url_str = f"/{url_str}"
        elif not url_str.startswith('/media/') and not url_str.startswith('/'):
            url_str = f"/media/{url_str}"

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url_str)
        return f"http://127.0.0.1:8000{url_str}"


class AdminUserDetailSerializer(UserSerializer):
    patient_profile = serializers.SerializerMethodField()
    doctor_profile = serializers.SerializerMethodField()
    activity_summary = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + [
            'patient_profile',
            'doctor_profile',
            'activity_summary',
        ]

    def get_patient_profile(self, obj):
        if obj.role != 'patient' or not hasattr(obj, 'patient_profile'):
            return None
        profile = getattr(obj, 'patient_profile', None)
        if not profile or getattr(profile, 'is_deleted', False):
            return None
        return {
            'id': str(profile.id),
            'date_of_birth': str(profile.date_of_birth) if profile.date_of_birth else None,
            'gender': profile.gender,
            'blood_group': profile.blood_group,
            'emergency_contact': profile.emergency_contact,
            'emergency_contact_name': profile.emergency_contact_name,
            'allergies': profile.allergies,
            'chronic_conditions': profile.chronic_conditions,
            'created_at': profile.created_at.isoformat() if profile.created_at else None,
            'updated_at': profile.updated_at.isoformat() if profile.updated_at else None,
        }

    def get_doctor_profile(self, obj):
        if obj.role != 'doctor' or not hasattr(obj, 'doctor_profile'):
            return None
        profile = getattr(obj, 'doctor_profile', None)
        if not profile or getattr(profile, 'is_deleted', False):
            return None
        return {
            'id': str(profile.id),
            'specialty': profile.specialty,
            'qualification': profile.qualification,
            'experience_years': profile.experience_years,
            'license_number': profile.license_number,
            'is_verified': profile.is_verified,
            'consultation_fee': str(profile.consultation_fee) if profile.consultation_fee is not None else '0.00',
            'available_days': profile.available_days or [],
            'available_time_start': str(profile.available_time_start) if profile.available_time_start else None,
            'available_time_end': str(profile.available_time_end) if profile.available_time_end else None,
            'average_rating': profile.average_rating,
            'total_reviews': profile.total_reviews,
            'created_at': profile.created_at.isoformat() if profile.created_at else None,
            'updated_at': profile.updated_at.isoformat() if profile.updated_at else None,
        }

    def get_activity_summary(self, obj):
        summary = {
            'total_appointments': 0,
            'completed_appointments': 0,
            'pending_appointments': 0,
            'cancelled_appointments': 0,
            'recent_appointments': [],
            'total_medical_records': 0,
            'total_invoices': 0,
        }
        if obj.role == 'patient' and hasattr(obj, 'patient_profile'):
            patient = getattr(obj, 'patient_profile', None)
            if patient and not getattr(patient, 'is_deleted', False):
                appts = patient.appointments.filter(is_deleted=False)
                summary['total_appointments'] = appts.count()
                summary['completed_appointments'] = appts.filter(status='completed').count()
                summary['pending_appointments'] = appts.filter(status='pending').count()
                summary['cancelled_appointments'] = appts.filter(status='cancelled').count()
                recent = appts.select_related('doctor__user').order_by('-appointment_date')[:5]
                summary['recent_appointments'] = [
                    {
                        'id': str(a.id),
                        'partner_name': a.doctor.user.full_name if (a.doctor and a.doctor.user) else 'Doctor',
                        'specialty': a.doctor.specialty if a.doctor else '',
                        'appointment_date': a.appointment_date.isoformat() if a.appointment_date else None,
                        'status': a.status,
                        'reason': a.reason,
                    }
                    for a in recent
                ]
                if hasattr(patient, 'medical_records'):
                    summary['total_medical_records'] = patient.medical_records.filter(is_deleted=False).count()
                if hasattr(patient, 'billings'):
                    summary['total_invoices'] = patient.billings.filter(is_deleted=False).count()
        elif obj.role == 'doctor' and hasattr(obj, 'doctor_profile'):
            doctor = getattr(obj, 'doctor_profile', None)
            if doctor and not getattr(doctor, 'is_deleted', False):
                appts = doctor.appointments.filter(is_deleted=False)
                summary['total_appointments'] = appts.count()
                summary['completed_appointments'] = appts.filter(status='completed').count()
                summary['pending_appointments'] = appts.filter(status='pending').count()
                summary['cancelled_appointments'] = appts.filter(status='cancelled').count()
                recent = appts.select_related('patient__user').order_by('-appointment_date')[:5]
                summary['recent_appointments'] = [
                    {
                        'id': str(a.id),
                        'partner_name': a.patient.user.full_name if (a.patient and a.patient.user) else 'Patient',
                        'specialty': '',
                        'appointment_date': a.appointment_date.isoformat() if a.appointment_date else None,
                        'status': a.status,
                        'reason': a.reason,
                    }
                    for a in recent
                ]
        return summary


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'password', 'password2', 'phone', 'address', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match'})
        return attrs

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already exists')
        return value

    def create(self, validated_data):
        validated_data.pop('password2')
        role = validated_data.get('role', 'patient')

        user = User.objects.create_user(**validated_data)

        # Auto-create profile based on role
        if role == 'patient':
            from apps.models.patient import Patient
            Patient.objects.create(
                user=user,
                date_of_birth='2000-01-01',
                gender='other'
            )
        elif role == 'doctor':
            from apps.models.doctor import Doctor
            Doctor.objects.create(
                user=user,
                specialty='general',
                qualification='Pending',
                experience_years=0,
                license_number=f'TEMP-{user.id.hex[:8].upper()}',
                is_verified=False
            )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        request = self.context.get('request')

        user = authenticate(request=request, email=email, password=password)
        if not user:
            user = authenticate(request=request, username=email, password=password)

        if not user:
            raise serializers.ValidationError('Invalid credentials')

        if not user.is_active:
            raise serializers.ValidationError('Account is disabled')

        if user.is_deleted:
            raise serializers.ValidationError('Account has been deleted')

        attrs['user'] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """Accepts both new_password2 and confirm_password for frontend compatibility."""
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=False, write_only=True, allow_blank=True)
    confirm_password = serializers.CharField(required=False, write_only=True, allow_blank=True)

    def validate(self, attrs):
        confirm = attrs.get('new_password2') or attrs.get('confirm_password')
        if not confirm:
            raise serializers.ValidationError({
                'new_password2': 'Confirmation password is required'
            })
        if attrs['new_password'] != confirm:
            raise serializers.ValidationError({
                'new_password2': 'Passwords do not match'
            })
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect')
        return value
