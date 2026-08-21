from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .user import User
from .patient import Patient
from .doctor import Doctor
from .appointment import Appointment
from .billing import Billing
from .medical_record import MedicalRecord


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'full_name', 'role', 'status', 'is_active', 'created_at')
    list_filter = ('role', 'status', 'is_active', 'is_deleted')
    search_fields = ('email', 'full_name', 'phone')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone', 'address', 'profile_picture')}),
        ('Permissions', {'fields': ('role', 'status', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'password1', 'password2'),
        }),
    )


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('user', 'gender', 'blood_group', 'created_at')
    search_fields = ('user__email', 'user__full_name')
    list_filter = ('gender', 'blood_group', 'is_deleted')


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialty', 'is_verified', 'consultation_fee')
    search_fields = ('user__email', 'user__full_name', 'license_number')
    list_filter = ('specialty', 'is_verified', 'is_deleted')


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'appointment_date', 'status')
    search_fields = ('patient__user__email', 'doctor__user__email')
    list_filter = ('status', 'appointment_date', 'is_deleted')


@admin.register(Billing)
class BillingAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'patient', 'total_amount', 'status', 'due_date')
    search_fields = ('invoice_number', 'patient__user__email')
    list_filter = ('status', 'payment_method', 'is_deleted')


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('title', 'patient', 'doctor', 'record_type', 'record_date')
    search_fields = ('title', 'patient__user__email')
    list_filter = ('record_type', 'record_date', 'is_deleted')