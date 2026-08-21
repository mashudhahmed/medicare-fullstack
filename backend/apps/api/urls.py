from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import auth_views
from .views import admin_views, patient_views, doctor_views, appointment_views, billing_views, medical_record_views

app_name = 'api'

# Router for ViewSets (if any)
# router = DefaultRouter()
# router.register('patients', patient_views.PatientViewSet)

urlpatterns = [
    # Authentication
    path('auth/register/', auth_views.RegisterView.as_view(), name='register'),
    path('auth/login/', auth_views.LoginView.as_view(), name='login'),
    path('auth/logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('auth/profile/', auth_views.ProfileView.as_view(), name='profile'),
    path('auth/change-password/', auth_views.ChangePasswordView.as_view(), name='change-password'),
    path('auth/refresh-token/', auth_views.RefreshTokenView.as_view(), name='refresh-token'),
    path('auth/status/', auth_views.UserStatusView.as_view(), name='auth-status'),

    # Admin
    path('admin/users/', admin_views.ListUsersView.as_view(), name='admin-users'),
    path('admin/users/<uuid:pk>/', admin_views.UserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<uuid:user_id>/status/', admin_views.UpdateUserStatusView.as_view(), name='admin-user-status'),

    # Patients
    path('patients/', patient_views.ListPatientsView.as_view(), name='patient-list'),
    path('patients/<uuid:pk>/', patient_views.PatientDetailView.as_view(), name='patient-detail'),
    path('patients/me/', patient_views.MyPatientProfileView.as_view(), name='my-patient-profile'),

    # Doctors
    path('doctors/', doctor_views.ListDoctorsView.as_view(), name='doctor-list'),
    path('doctors/<uuid:pk>/', doctor_views.DoctorDetailView.as_view(), name='doctor-detail'),
    path('doctors/me/', doctor_views.MyDoctorProfileView.as_view(), name='my-doctor-profile'),

    # Appointments
    path('appointments/', appointment_views.ListCreateAppointmentsView.as_view(), name='appointment-list'),
    path('appointments/<uuid:pk>/', appointment_views.AppointmentDetailView.as_view(), name='appointment-detail'),
    path('appointments/<uuid:pk>/cancel/', appointment_views.CancelAppointmentView.as_view(), name='appointment-cancel'),
    path('appointments/my/', appointment_views.MyAppointmentsView.as_view(), name='my-appointments'),

    # Billing
    path('billing/', billing_views.ListCreateBillingView.as_view(), name='billing-list'),
    path('billing/<uuid:pk>/', billing_views.BillingDetailView.as_view(), name='billing-detail'),
    path('billing/my/', billing_views.MyBillingView.as_view(), name='my-billing'),
    path('billing/<uuid:pk>/pay/', billing_views.PayBillingView.as_view(), name='billing-pay'),

    # Medical Records
    path('medical-records/', medical_record_views.ListCreateMedicalRecordsView.as_view(), name='medical-record-list'),
    path('medical-records/<uuid:pk>/', medical_record_views.MedicalRecordDetailView.as_view(), name='medical-record-detail'),
    path('medical-records/my/', medical_record_views.MyMedicalRecordsView.as_view(), name='my-medical-records'),
    path('patients/<uuid:patient_id>/records/', medical_record_views.PatientMedicalRecordsView.as_view(), name='patient-medical-records'),
]