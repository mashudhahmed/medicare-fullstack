from .auth_views import RegisterView, LoginView, LogoutView, ProfileView
from .patient_views import PatientProfileView
from .doctor_views import (
    DoctorListView, DoctorDetailView, DoctorProfileView,
    DoctorAvailabilityView, DoctorAvailabilityDetailView
)
from .appointment_views import (
    AppointmentListCreateView, AppointmentDetailView,
    AppointmentCancelView, AvailableSlotsView
)
from .medical_record_views import (
    MedicalRecordListCreateView, MedicalRecordDetailView,
    PrescriptionListCreateView, PrescriptionDetailView
)
from .billing_views import (
    InvoiceListCreateView, InvoiceDetailView,
    PaymentListCreateView, PaymentDetailView
)
from .admin_views import (
    AdminDashboardView, AdminUserListView, AdminUserDetailView,
    AdminDoctorApprovalView, AdminPendingDoctorsView,
    AdminSystemLogsView, AdminSystemSettingsView, AdminReportView
)

__all__ = [
    'RegisterView',
    'LoginView',
    'LogoutView',
    'ProfileView',
    'PatientProfileView',
    'DoctorListView',
    'DoctorDetailView',
    'DoctorProfileView',
    'DoctorAvailabilityView',
    'DoctorAvailabilityDetailView',
    'AppointmentListCreateView',
    'AppointmentDetailView',
    'AppointmentCancelView',
    'AvailableSlotsView',
    'MedicalRecordListCreateView',
    'MedicalRecordDetailView',
    'PrescriptionListCreateView',
    'PrescriptionDetailView',
    'InvoiceListCreateView',
    'InvoiceDetailView',
    'PaymentListCreateView',
    'PaymentDetailView',
    'AdminDashboardView',
    'AdminUserListView',
    'AdminUserDetailView',
    'AdminDoctorApprovalView',
    'AdminPendingDoctorsView',
    'AdminSystemLogsView',
    'AdminSystemSettingsView',
    'AdminReportView',
]
