from django.urls import path
from .views import auth_views
from .views import admin_views, patient_views, doctor_views, appointment_views, billing_views, medical_record_views
from .views import notification_views, prescription_views, audit_views

app_name = 'api'

urlpatterns = [
    # Authentication
    path('auth/register/', auth_views.RegisterView.as_view(), name='register'),
    path('auth/login/', auth_views.LoginView.as_view(), name='login'),
    path('auth/logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('auth/profile/', auth_views.ProfileView.as_view(), name='profile'),
    path('auth/change-password/', auth_views.ChangePasswordView.as_view(), name='change-password'),
    path('auth/refresh-token/', auth_views.RefreshTokenView.as_view(), name='refresh-token'),
    # Alias for SimpleJWT-style path (frontend compatibility)
    path('auth/token/refresh/', auth_views.RefreshTokenView.as_view(), name='token-refresh'),
    path('auth/status/', auth_views.UserStatusView.as_view(), name='auth-status'),
    # Password Reset
    path('auth/password-reset/', auth_views.PasswordResetRequestView.as_view(), name='password-reset'),
    path('auth/password-reset/confirm/', auth_views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # Admin
    path('admin/dashboard/', admin_views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/users/', admin_views.ListUsersView.as_view(), name='admin-users'),
    path('admin/users/<uuid:pk>/', admin_views.UserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<uuid:user_id>/status/', admin_views.UpdateUserStatusView.as_view(), name='admin-user-status'),
    path('admin/doctors/pending/', admin_views.PendingDoctorsView.as_view(), name='admin-pending-doctors'),
    path('admin/doctors/<uuid:doctor_id>/verify/', admin_views.VerifyDoctorView.as_view(), name='admin-verify-doctor'),
    path('admin/doctors/<uuid:doctor_id>/approve/', admin_views.VerifyDoctorView.as_view(), name='admin-approve-doctor'),
    path('admin/audit-logs/', audit_views.ListAuditLogsView.as_view(), name='admin-audit-logs'),

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
    path('appointments/<uuid:pk>/reschedule/', appointment_views.RescheduleAppointmentView.as_view(), name='appointment-reschedule'),
    path('appointments/<uuid:pk>/video/', appointment_views.JoinVideoConsultationView.as_view(), name='appointment-video'),
    path('appointments/my/', appointment_views.MyAppointmentsView.as_view(), name='my-appointments'),
    path('appointments/available-slots/<uuid:doctor_id>/', appointment_views.AvailableSlotsView.as_view(), name='available-slots'),

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

    # Prescriptions
    path('prescriptions/', prescription_views.ListCreatePrescriptionView.as_view(), name='prescription-list'),
    path('prescriptions/<uuid:pk>/', prescription_views.PrescriptionDetailView.as_view(), name='prescription-detail'),
    path('prescriptions/my/', prescription_views.MyPrescriptionsView.as_view(), name='my-prescriptions'),
    path('prescriptions/<uuid:pk>/refill/', prescription_views.RefillPrescriptionView.as_view(), name='prescription-refill'),

    # Notifications
    path('notifications/', notification_views.NotificationListView.as_view(), name='notifications'),
    path('notifications/<uuid:pk>/read/', notification_views.MarkNotificationReadView.as_view(), name='notification-read'),
    path('notifications/read-all/', notification_views.MarkAllNotificationsReadView.as_view(), name='notifications-read-all'),
]
