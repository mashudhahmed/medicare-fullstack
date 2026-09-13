from django.test import TestCase
from django.utils import timezone
from apps.models.user import User
from apps.models.patient import Patient
from apps.models.doctor import Doctor
from apps.models.appointment import Appointment
from apps.models.billing import Billing
from apps.models.prescription import Prescription
from apps.models.audit_log import AuditLog
from apps.models.notification import Notification
from apps.services.notification_service import NotificationService
from apps.utils.audit import log_audit


class CoreFeaturesTest(TestCase):
    def setUp(self):
        # Create Patient User
        self.patient_user = User.objects.create_user(
            email='patient@medicare.local',
            password='TestPassword123!',
            full_name='Jane Doe',
            role='patient',
            status='approved'
        )
        self.patient = Patient.objects.create(
            user=self.patient_user,
            date_of_birth='1995-05-15',
            gender='female',
            blood_group='O+'
        )

        # Create Doctor User
        self.doctor_user = User.objects.create_user(
            email='doctor@medicare.local',
            password='TestPassword123!',
            full_name='Dr. Gregory House',
            role='doctor',
            status='approved'
        )
        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            specialty='cardiology',
            qualification='MD, FACC',
            experience_years=15,
            license_number='LIC-998822',
            is_verified=True,
            consultation_fee=150.00
        )

    def test_user_full_name_methods(self):
        """Verify User model has get_full_name and get_short_name without raising AttributeError"""
        self.assertEqual(self.patient_user.get_full_name(), 'Jane Doe')
        self.assertEqual(self.patient_user.get_short_name(), 'Jane')
        self.assertEqual(self.doctor_user.get_full_name(), 'Dr. Gregory House')

    def test_appointment_video_room_auto_generation(self):
        """Verify appointment creates a telemedicine video room id"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.now() + timezone.timedelta(days=1),
            reason='Routine cardiology consultation',
            status='confirmed'
        )
        self.assertTrue(appointment.video_room_id.startswith('medicare-room-'))

    def test_billing_auto_defaults(self):
        """Verify Billing auto-generates invoice number and sets default due date"""
        billing = Billing.objects.create(
            patient=self.patient,
            amount=150.00,
            status='pending'
        )
        self.assertTrue(billing.invoice_number.startswith('INV-'))
        self.assertIsNotNone(billing.due_date)
        self.assertEqual(billing.total_amount, 150.00)

    def test_prescription_and_refills(self):
        """Verify Prescription model and refill logic"""
        prescription = Prescription.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            medication_name='Lisinopril',
            dosage='10mg',
            frequency='Once daily',
            duration_days=30,
            refills_allowed=2,
            status=Prescription.Status.ACTIVE
        )
        self.assertTrue(prescription.can_refill())
        self.assertEqual(prescription.refills_used, 0)

        # Refill once
        prescription.refills_used += 1
        prescription.save()
        self.assertTrue(prescription.can_refill())

        # Refill second time (max reached)
        prescription.refills_used += 1
        prescription.save()
        self.assertFalse(prescription.can_refill())

    def test_audit_log_utility(self):
        """Verify log_audit creates an AuditLog record"""
        entry = log_audit(
            request=None,
            action=AuditLog.Action.CREATE,
            resource_type='Prescription',
            resource_id='test-uuid',
            details={'note': 'Audit test'}
        )
        self.assertIsNotNone(entry)
        self.assertEqual(entry.action, AuditLog.Action.CREATE)
        self.assertEqual(AuditLog.objects.count(), 1)

    def test_notification_service_category_mapping(self):
        """Verify NotificationService maps category to notification_type without KeyError/TypeError"""
        notification = NotificationService.send_user_notification(
            user=self.patient_user,
            title='Appointment Reminder',
            message='Your appointment is tomorrow.',
            category='APPOINTMENT_REMINDER',
            send_email=False
        )
        self.assertEqual(notification.notification_type, Notification.Type.APPOINTMENT)
        self.assertEqual(notification.user, self.patient_user)

    def test_password_reset_code_model_and_validation(self):
        """Verify 6-digit PasswordResetCode creation, expiration, and one-time use"""
        from apps.models.password_reset import PasswordResetCode
        code_obj = PasswordResetCode.create_for_user(self.patient_user, expiry_minutes=15)
        self.assertEqual(len(code_obj.code), 6)
        self.assertTrue(code_obj.code.isdigit())
        self.assertTrue(code_obj.is_valid())

        # Consume code
        code_obj.is_used = True
        code_obj.save()
        self.assertFalse(code_obj.is_valid())
