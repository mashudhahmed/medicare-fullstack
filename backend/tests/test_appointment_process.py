from django.test import TestCase
from django.utils import timezone
from datetime import datetime, time, timedelta
from rest_framework.test import APIClient
from apps.models.user import User
from apps.models.patient import Patient
from apps.models.doctor import Doctor
from apps.models.appointment import Appointment


class AppointmentProcessFlowTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Create Patient User & Profile
        self.patient_user = User.objects.create_user(
            email='alice.patient@medicare.local',
            password='TestPassword123!',
            full_name='Alice Smith',
            role='patient',
            status='approved'
        )
        self.patient = Patient.objects.create(
            user=self.patient_user,
            date_of_birth='1990-05-15',
            gender='female',
            blood_group='O+'
        )

        # 2. Create Second Patient User (for isolation testing)
        self.other_patient_user = User.objects.create_user(
            email='bob.patient@medicare.local',
            password='TestPassword123!',
            full_name='Bob Brown',
            role='patient',
            status='approved'
        )
        self.other_patient = Patient.objects.create(
            user=self.other_patient_user,
            date_of_birth='1988-02-20',
            gender='male',
            blood_group='A+'
        )

        # 3. Create Doctor User & Profile
        self.doctor_user = User.objects.create_user(
            email='dr.house@medicare.local',
            password='DoctorPassword123!',
            full_name='Gregory House',
            role='doctor',
            status='approved'
        )
        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            specialty='cardiology',
            qualification='MD, FACC',
            experience_years=15,
            license_number='MD-CARD-9911',
            is_verified=True,
            consultation_fee=120.00,
            available_days=['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            available_time_start=time(9, 0),
            available_time_end=time(17, 0)
        )

    def test_full_appointment_booking_and_lifecycle(self):
        """Test complete appointment lifecycle: slots -> booking -> conflict -> video -> reschedule -> cancel"""
        # 1. Check Available Slots for tomorrow
        tomorrow = timezone.localdate() + timedelta(days=1)
        self.client.force_authenticate(user=self.patient_user)
        slots_resp = self.client.get(f'/api/appointments/available-slots/{self.doctor.id}/?date={tomorrow.isoformat()}')
        self.assertEqual(slots_resp.status_code, 200)
        slots = slots_resp.data.get('slots', [])
        self.assertGreater(len(slots), 0, "Doctor should have available slots")

        chosen_slot = slots[0]

        # 2. Book appointment with valid slot
        book_resp = self.client.post('/api/appointments/', {
            'doctor': str(self.doctor.id),
            'appointment_date': chosen_slot,
            'duration_minutes': 30,
            'reason': 'Arrhythmia consultation',
            'notes': 'Occasional palpitations'
        })
        if book_resp.status_code != 201:
            print("BOOKING ERROR:", book_resp.status_code, book_resp.data)
        self.assertEqual(book_resp.status_code, 201)
        appt_id = book_resp.data['id']
        self.assertEqual(book_resp.data['status'], 'pending')
        self.assertEqual(str(book_resp.data['patient']), str(self.patient.id))
        self.assertTrue(book_resp.data['video_room_id'].startswith('medicare-room-'))

        # 3. Verify double-booking prevention: Second booking on same slot must fail
        self.client.force_authenticate(user=self.other_patient_user)
        conflict_resp = self.client.post('/api/appointments/', {
            'doctor': str(self.doctor.id),
            'appointment_date': chosen_slot,
            'duration_minutes': 30,
            'reason': 'Routine checkup'
        })
        self.assertEqual(conflict_resp.status_code, 400)
        self.assertIn('already booked', str(conflict_resp.data))

        # 4. Verify past date booking prevention
        past_date = (timezone.now() - timedelta(days=1)).isoformat()
        past_resp = self.client.post('/api/appointments/', {
            'doctor': str(self.doctor.id),
            'appointment_date': past_date,
            'duration_minutes': 30,
            'reason': 'Past booking check'
        })
        self.assertEqual(past_resp.status_code, 400)

        # 5. Doctor joins video consultation
        self.client.force_authenticate(user=self.doctor_user)
        video_resp = self.client.get(f'/api/appointments/{appt_id}/video/')
        self.assertEqual(video_resp.status_code, 200)
        self.assertTrue(video_resp.data['is_doctor'])
        self.assertEqual(video_resp.data['status'], 'in_progress')

        # 6. Unauthorized user cannot access video consultation
        self.client.force_authenticate(user=self.other_patient_user)
        unauth_video = self.client.get(f'/api/appointments/{appt_id}/video/')
        self.assertEqual(unauth_video.status_code, 403)

        # 7. Reschedule appointment to slot 2 days ahead
        future_slot = (timezone.now() + timedelta(days=2)).replace(microsecond=0)
        self.client.force_authenticate(user=self.patient_user)
        reschedule_resp = self.client.post(f'/api/appointments/{appt_id}/reschedule/', {
            'appointment_date': future_slot.isoformat()
        })
        self.assertEqual(reschedule_resp.status_code, 200)
        self.assertEqual(reschedule_resp.data['appointment']['status'], 'confirmed')

        # 8. Cancel appointment
        cancel_resp = self.client.post(f'/api/appointments/{appt_id}/cancel/')
        self.assertEqual(cancel_resp.status_code, 200)

        # Verify status is now cancelled
        appt_record = Appointment.objects.get(id=appt_id)
        self.assertEqual(appt_record.status, 'cancelled')

        # 9. Verify cannot cancel an already cancelled appointment
        recancel_resp = self.client.post(f'/api/appointments/{appt_id}/cancel/')
        self.assertEqual(recancel_resp.status_code, 400)
