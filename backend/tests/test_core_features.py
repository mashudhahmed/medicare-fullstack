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

    def test_login_and_logout_audit_logging(self):
        """Verify login and logout create audit log entries with user details"""
        from rest_framework.test import APIClient
        client = APIClient()

        # Login
        response = client.post('/api/auth/login/', {
            'email': 'patient@medicare.local',
            'password': 'TestPassword123!',
        })
        self.assertEqual(response.status_code, 200)
        refresh_token = response.data['refresh']

        login_log = AuditLog.objects.filter(action='LOGIN', user=self.patient_user).first()
        self.assertIsNotNone(login_log)
        self.assertEqual(login_log.resource_type, 'User')
        self.assertEqual(login_log.details.get('role'), 'patient')
        self.assertEqual(login_log.details.get('method'), 'password')

        # Logout
        logout_response = client.post('/api/auth/logout/', {
            'refresh': refresh_token
        }, HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        self.assertEqual(logout_response.status_code, 200)

        logout_log = AuditLog.objects.filter(action='LOGOUT', user=self.patient_user).first()
        self.assertIsNotNone(logout_log)
        self.assertEqual(logout_log.resource_type, 'User')

    def test_prescription_pdf_endpoint(self):
        """Verify prescription PDF endpoint returns 200 and application/pdf"""
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.patient_user)

        prescription = Prescription.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            medication_name='Amoxicillin 500mg',
            dosage='1 capsule',
            frequency='Every 8 hours',
            duration_days=7,
            instructions='Take after meals',
            refills_allowed=1,
            status='active'
        )

        response = client.get(f'/api/prescriptions/{prescription.id}/pdf/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(len(response.content) > 500)
        self.assertTrue(response.content.startswith(b'%PDF'))

    def test_billing_invoice_pdf_endpoint(self):
        """Verify billing invoice PDF endpoint returns 200 and application/pdf"""
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.patient_user)

        billing = Billing.objects.create(
            patient=self.patient,
            amount=150.00,
            status='paid',
            payment_method='cash',
            description='Consultation Fee'
        )

        response = client.get(f'/api/billing/{billing.id}/pdf/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(len(response.content) > 500)
        self.assertTrue(response.content.startswith(b'%PDF'))

    def test_doctor_review_creation_and_rating_calculation(self):
        """Verify patient can review a doctor and doctor rating updates"""
        from rest_framework.test import APIClient
        from apps.models.review import DoctorReview
        client = APIClient()
        client.force_authenticate(user=self.patient_user)

        # Submit review
        response = client.post('/api/reviews/', {
            'doctor': str(self.doctor.id),
            'rating': 5,
            'comment': 'Outstanding cardiologist, very thorough and compassionate.'
        })
        self.assertEqual(response.status_code, 201)

        # Check review was created in DB
        self.assertEqual(DoctorReview.objects.count(), 1)
        review = DoctorReview.objects.first()
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.patient, self.patient)

        # Check doctor computed properties
        self.assertEqual(self.doctor.total_reviews, 1)
        self.assertEqual(self.doctor.average_rating, 5.0)

        # Check doctor reviews endpoint
        list_resp = client.get(f'/api/doctors/{self.doctor.id}/reviews/')
        self.assertEqual(list_resp.status_code, 200)
        results = list_resp.data if isinstance(list_resp.data, list) else list_resp.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['rating'], 5)

    def test_patient_vitals_logging_and_bmi_calculation(self):
        """Verify patient can log vitals, BMI is calculated, and history endpoint returns records"""
        from rest_framework.test import APIClient
        from apps.models.vital import PatientVital
        client = APIClient()
        client.force_authenticate(user=self.patient_user)

        response = client.post('/api/vitals/', {
            'systolic_bp': 120,
            'diastolic_bp': 80,
            'heart_rate': 72,
            'blood_glucose': 95.5,
            'glucose_context': 'fasting',
            'oxygen_saturation': 98,
            'temperature_c': 36.8,
            'weight_kg': 70.0,
            'height_cm': 175.0,
            'notes': 'Normal morning reading'
        })
        self.assertEqual(response.status_code, 201)
        data = response.data
        self.assertEqual(data['bp_reading'], '120/80')
        self.assertEqual(float(data['bmi']), 22.9)
        self.assertEqual(data['bmi_category'], 'Normal')

        # Check DB
        vital = PatientVital.objects.filter(patient=self.patient).first()
        self.assertIsNotNone(vital)
        self.assertEqual(vital.recorded_by, self.patient_user)
        self.assertEqual(vital.heart_rate, 72)

        # Check history endpoint
        history_resp = client.get(f'/api/patients/{self.patient.id}/vitals/')
        self.assertEqual(history_resp.status_code, 200)
        history_results = history_resp.data if isinstance(history_resp.data, list) else history_resp.data.get('results', [])
        self.assertEqual(len(history_results), 1)
        self.assertEqual(history_results[0]['bp_reading'], '120/80')

    def test_drug_allergy_and_cross_interaction_safety_alerts(self):
        """Verify allergy detection, drug interaction alerts, and clinical override requirement"""
        from rest_framework.test import APIClient
        from apps.models.audit_log import AuditLog
        client = APIClient()
        client.force_authenticate(user=self.doctor_user)

        # 1. Update patient with documented penicillin allergy
        self.patient.allergies = 'Penicillin, Peanuts'
        self.patient.save()

        # 2. Check safety pre-check endpoint with Amoxicillin (Penicillin class)
        precheck_resp = client.post('/api/prescriptions/check-safety/', {
            'patient': str(self.patient.id),
            'medication_name': 'Amoxicillin 500mg'
        })
        self.assertEqual(precheck_resp.status_code, 200)
        safety_data = precheck_resp.data
        self.assertFalse(safety_data['is_safe'])
        self.assertTrue(safety_data['has_warnings'])
        self.assertEqual(safety_data['highest_severity'], 'critical')
        self.assertTrue(any(a['type'] == 'allergy' for a in safety_data['alerts']))

        # 3. Attempt to prescribe Amoxicillin without acknowledge_warnings (should fail 400)
        blocked_resp = client.post('/api/prescriptions/', {
            'patient': str(self.patient.id),
            'medication_name': 'Amoxicillin',
            'dosage': '500mg',
            'frequency': '3 times daily',
            'duration_days': 7,
            'acknowledge_warnings': False
        })
        self.assertEqual(blocked_resp.status_code, 400)
        errors = blocked_resp.data.get('errors', blocked_resp.data)
        self.assertIn('safety_warning', errors)

        # 4. Prescribe with acknowledge_warnings and override_reason (should succeed 201)
        override_resp = client.post('/api/prescriptions/', {
            'patient': str(self.patient.id),
            'medication_name': 'Amoxicillin',
            'dosage': '500mg',
            'frequency': '3 times daily',
            'duration_days': 7,
            'acknowledge_warnings': True,
            'override_reason': 'Patient evaluated in allergy clinic; tolerance confirmed under observation.'
        })
        self.assertEqual(override_resp.status_code, 201)
        rx_data = override_resp.data
        self.assertTrue(rx_data['has_safety_warning'])
        self.assertEqual(rx_data['override_reason'], 'Patient evaluated in allergy clinic; tolerance confirmed under observation.')
        self.assertTrue(len(rx_data['safety_alerts']) > 0)

        # 5. Check audit log for SAFETY_OVERRIDE
        override_log = AuditLog.objects.filter(action='SAFETY_OVERRIDE', resource_type='Prescription').first()
        self.assertIsNotNone(override_log)

        # 6. Test drug-drug interaction: active Warfarin + proposed Ibuprofen
        # Create active Warfarin prescription
        Prescription.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            medication_name='Warfarin',
            dosage='5mg',
            frequency='Once daily',
            status=Prescription.Status.ACTIVE
        )

        interaction_check = client.post('/api/prescriptions/check-safety/', {
            'patient': str(self.patient.id),
            'medication_name': 'Ibuprofen 400mg'
        })
        self.assertEqual(interaction_check.status_code, 200)
        int_data = interaction_check.data
        self.assertFalse(int_data['is_safe'])
        self.assertTrue(any(a['type'] == 'interaction' for a in int_data['alerts']))
        interaction_alert = next(a for a in int_data['alerts'] if a['type'] == 'interaction')
        self.assertEqual(interaction_alert['severity'], 'critical')
        self.assertEqual(interaction_alert['conflict_with'], 'Warfarin')




