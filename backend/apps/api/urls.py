from django.urls import path
from .views import *

urlpatterns = [
    # Authentication
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    
    # Patient
    path('patient/profile/', PatientProfileView.as_view(), name='patient-profile'),
    
    # Doctor
    path('doctors/', DoctorListView.as_view(), name='doctor-list'),
    path('doctors/<int:pk>/', DoctorDetailView.as_view(), name='doctor-detail'),
    path('doctor/profile/', DoctorProfileView.as_view(), name='doctor-profile'),
    path('doctor/availability/', DoctorAvailabilityView.as_view(), name='doctor-availability'),
    path('doctor/availability/<int:pk>/', DoctorAvailabilityDetailView.as_view(), name='doctor-availability-detail'),
    
    # Appointment
    path('appointments/', AppointmentListCreateView.as_view(), name='appointment-list'),
    path('appointments/<int:pk>/', AppointmentDetailView.as_view(), name='appointment-detail'),
    path('appointments/<int:pk>/cancel/', AppointmentCancelView.as_view(), name='appointment-cancel'),
    path('appointments/available-slots/<int:doctor_id>/', AvailableSlotsView.as_view(), name='available-slots'),
    
    # Medical Records
    path('medical-records/', MedicalRecordListCreateView.as_view(), name='medical-record-list'),
    path('medical-records/<int:pk>/', MedicalRecordDetailView.as_view(), name='medical-record-detail'),
    path('prescriptions/', PrescriptionListCreateView.as_view(), name='prescription-list'),
    path('prescriptions/<int:pk>/', PrescriptionDetailView.as_view(), name='prescription-detail'),
    
    # Billing
    path('invoices/', InvoiceListCreateView.as_view(), name='invoice-list'),
    path('invoices/<int:pk>/', InvoiceDetailView.as_view(), name='invoice-detail'),
    path('payments/', PaymentListCreateView.as_view(), name='payment-list'),
    path('payments/<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    
    # Admin
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/doctors/pending/', AdminPendingDoctorsView.as_view(), name='admin-pending-doctors'),
    path('admin/doctors/<int:doctor_id>/approve/', AdminDoctorApprovalView.as_view(), name='admin-approve-doctor'),
    path('admin/logs/', AdminSystemLogsView.as_view(), name='admin-logs'),
    path('admin/settings/', AdminSystemSettingsView.as_view(), name='admin-settings'),
    path('admin/reports/', AdminReportView.as_view(), name='admin-reports'),
]
