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

    def test_doctor_patient_chat_messaging_and_threads(self):
        """Verify direct doctor-patient messaging, conversation threads, read receipts, and unread counts"""
        from rest_framework.test import APIClient
        from apps.models.chat_message import ChatMessage
        client = APIClient()

        # 1. Patient sends message to doctor
        client.force_authenticate(user=self.patient_user)
        send_resp = client.post('/api/messages/', {
            'recipient': str(self.doctor_user.id),
            'content': 'Hello Dr. House, I have a quick question about my medication dosage.'
        })
        self.assertEqual(send_resp.status_code, 201)
        self.assertEqual(send_resp.data['sender_name'], self.patient_user.get_full_name())
        self.assertFalse(send_resp.data['is_read'])

        # 2. Check doctor's unread count
        client.force_authenticate(user=self.doctor_user)
        unread_resp = client.get('/api/messages/unread-count/')
        self.assertEqual(unread_resp.status_code, 200)
        self.assertEqual(unread_resp.data['unread_count'], 1)

        # 3. Check doctor's conversations list
        conv_resp = client.get('/api/messages/conversations/')
        self.assertEqual(conv_resp.status_code, 200)
        self.assertEqual(len(conv_resp.data), 1)
        self.assertEqual(conv_resp.data[0]['full_name'], self.patient_user.get_full_name())
        self.assertEqual(conv_resp.data[0]['unread_count'], 1)

        # 4. Doctor opens thread (should auto-mark as read)
        thread_resp = client.get(f'/api/messages/{self.patient_user.id}/')
        self.assertEqual(thread_resp.status_code, 200)
        self.assertEqual(len(thread_resp.data), 1)
        self.assertTrue(thread_resp.data[0]['is_read'])

        # Doctor unread count should now be 0
        unread_after = client.get('/api/messages/unread-count/')
        self.assertEqual(unread_after.data['unread_count'], 0)

        # 5. Doctor replies
        reply_resp = client.post('/api/messages/', {
            'recipient': str(self.patient_user.id),
            'content': 'Take 10mg once daily in the morning with a glass of water.'
        })
        self.assertEqual(reply_resp.status_code, 201)

        # 6. Patient views thread (now contains 2 messages)
        client.force_authenticate(user=self.patient_user)
        patient_thread = client.get(f'/api/messages/{self.doctor_user.id}/')
        self.assertEqual(patient_thread.status_code, 200)
        self.assertEqual(len(patient_thread.data), 2)
        self.assertEqual(patient_thread.data[1]['content'], 'Take 10mg once daily in the morning with a glass of water.')

    def test_celery_appointment_reminders_and_duplicate_prevention(self):
        """Verify 24-hour reminder dispatch, reminder_sent flag update, duplicate prevention, and manual trigger"""
        from rest_framework.test import APIClient
        from apps.services.celery_tasks import send_appointment_reminders, send_same_day_reminders
        from apps.models.notification import Notification

        # 1. Create upcoming confirmed appointment in 24h window
        appt_24h = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.now() + timezone.timedelta(hours=24),
            reason='Cardiology follow-up checkup',
            status='confirmed',
            reminder_sent=False
        )

        # 2. Run Celery reminder task
        res_24 = send_appointment_reminders()
        self.assertIn('Dispatched 1', res_24)

        # 3. Verify reminder_sent is set to True
        appt_24h.refresh_from_db()
        self.assertTrue(appt_24h.reminder_sent)
        self.assertIsNotNone(appt_24h.reminder_sent_at)

        # 4. Verify notification was created
        notif = Notification.objects.filter(user=self.patient_user).order_by('-created_at').first()
        self.assertIsNotNone(notif)
        self.assertIn('Upcoming Appointment Reminder', notif.title)

        # 5. Run Celery reminder task again (Duplicate prevention: should dispatch 0)
        res_dup = send_appointment_reminders()
        self.assertIn('Dispatched 0', res_dup)

        # 6. Test manual trigger endpoint by doctor
        client = APIClient()
        client.force_authenticate(user=self.doctor_user)
        trigger_resp = client.post(f'/api/appointments/{appt_24h.id}/send-reminder/')
        self.assertEqual(trigger_resp.status_code, 200)
        self.assertTrue(trigger_resp.data['reminder_sent'])

    def test_admin_analytics_and_csv_export(self):
        """Verify Admin analytics aggregations and CSV data export endpoints"""
        from rest_framework.test import APIClient

        # Create Admin User
        admin_user = User.objects.create_user(
            email='admin@medicare.local',
            password='AdminPassword123!',
            full_name='Chief Administrator',
            role='admin',
            status='approved'
        )

        # Create an appointment and billing record
        appt = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            appointment_date=timezone.now(),
            reason='Routine Checkup',
            status='completed'
        )
        Billing.objects.create(
            patient=self.patient,
            appointment=appt,
            amount=150.00,
            tax=15.00,
            discount=0.00,
            status=Billing.Status.PAID,
            payment_method=Billing.PaymentMethod.CASH
        )

        client = APIClient()

        # 1. Non-admin cannot access analytics or exports
        client.force_authenticate(user=self.patient_user)
        resp_forbidden = client.get('/api/admin/analytics/')
        self.assertEqual(resp_forbidden.status_code, 403)

        resp_forbidden_export = client.get('/api/admin/export/appointments/')
        self.assertEqual(resp_forbidden_export.status_code, 403)

        # 2. Admin access analytics
        client.force_authenticate(user=admin_user)
        analytics_resp = client.get('/api/admin/analytics/')
        self.assertEqual(analytics_resp.status_code, 200)
        self.assertIn('summary', analytics_resp.data)
        self.assertIn('monthly_trends', analytics_resp.data)
        self.assertIn('specialty_distribution', analytics_resp.data)
        self.assertIn('status_distribution', analytics_resp.data)
        self.assertEqual(analytics_resp.data['summary']['completed_appointments'], 1)
        self.assertEqual(analytics_resp.data['summary']['total_revenue'], 165.0)

        # 3. Export Appointments CSV
        export_appt_resp = client.get('/api/admin/export/appointments/')
        self.assertEqual(export_appt_resp.status_code, 200)
        self.assertEqual(export_appt_resp['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename="appointments_export_', export_appt_resp['Content-Disposition'])
        appt_csv_content = export_appt_resp.content.decode('utf-8')
        self.assertIn('Appointment ID,Patient Name,Patient Email', appt_csv_content)
        self.assertIn('Jane Doe', appt_csv_content)
        self.assertIn('Dr. Gregory House', appt_csv_content)

        # 4. Export Billing CSV
        export_bill_resp = client.get('/api/admin/export/billing/')
        self.assertEqual(export_bill_resp.status_code, 200)
        self.assertEqual(export_bill_resp['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename="billing_export_', export_bill_resp['Content-Disposition'])
        bill_csv_content = export_bill_resp.content.decode('utf-8')
        self.assertIn('Invoice Number,Patient Name,Patient Email,Amount', bill_csv_content)
        self.assertIn('Jane Doe', bill_csv_content)
        self.assertIn('165.0', bill_csv_content)

        # 5. Export Patients CSV
        export_pat_resp = client.get('/api/admin/export/patients/')
        self.assertEqual(export_pat_resp.status_code, 200)
        self.assertEqual(export_pat_resp['Content-Type'], 'text/csv')
        pat_csv_content = export_pat_resp.content.decode('utf-8')
        self.assertIn('Patient ID,Full Name,Email', pat_csv_content)
        self.assertIn('Jane Doe', pat_csv_content)

        # 6. Export Doctors CSV
        export_doc_resp = client.get('/api/admin/export/doctors/')
        self.assertEqual(export_doc_resp.status_code, 200)
        self.assertEqual(export_doc_resp['Content-Type'], 'text/csv')
        doc_csv_content = export_doc_resp.content.decode('utf-8')
        self.assertIn('Doctor ID,Full Name,Email,Phone,Specialty', doc_csv_content)
        self.assertIn('Dr. Gregory House', doc_csv_content)

    def test_doctor_profile_public_view_and_permissions(self):
        """Verify patients can view doctor profile and search doctors, while mutations remain restricted"""
        from rest_framework.test import APIClient
        client = APIClient()

        # 1. Patient views doctor details
        client.force_authenticate(user=self.patient_user)
        detail_resp = client.get(f'/api/doctors/{self.doctor.id}/')
        self.assertEqual(detail_resp.status_code, 200)
        self.assertEqual(detail_resp.data['specialty'], 'cardiology')
        self.assertEqual(detail_resp.data['user']['full_name'], 'Dr. Gregory House')

        # 2. Patient tries to delete doctor (must be 403 Forbidden)
        delete_resp = client.delete(f'/api/doctors/{self.doctor.id}/')
        self.assertEqual(delete_resp.status_code, 403)

        # 3. Patient searches doctors list with query
        list_resp = client.get('/api/doctors/?search=House&specialty=cardiology')
        self.assertEqual(list_resp.status_code, 200)
        results = list_resp.data['results'] if 'results' in list_resp.data else list_resp.data
        self.assertEqual(len(results), 1)

        # 4. Doctor views patient details
        client.force_authenticate(user=self.doctor_user)
        pat_detail_resp = client.get(f'/api/patients/{self.patient.id}/')
        self.assertEqual(pat_detail_resp.status_code, 200)
        self.assertEqual(pat_detail_resp.data['blood_group'], 'O+')






