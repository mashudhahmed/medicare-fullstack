import os
from datetime import time, date
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.models.user import User
from apps.models.doctor import Doctor
from apps.models.patient import Patient
from apps.models.audit_log import AuditLog


class Command(BaseCommand):
    help = 'Seeds standard demo accounts for Admin, Doctor, and Patient with known credentials.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('--> Seeding and refreshing MediCare demo accounts...'))

        with transaction.atomic():
            # 1. Admin Account
            admin_email = 'admin@medicare.local'
            admin_pass = 'Admin@Medicare2026!'
            admin_user = User.all_objects.filter(email=admin_email).first()

            if not admin_user:
                admin_user = User.objects.create_superuser(
                    email=admin_email,
                    password=admin_pass,
                    full_name='System Administrator',
                    phone='+18005550199',
                    role=User.Role.ADMIN,
                    status=User.Status.APPROVED
                )
            else:
                admin_user.full_name = 'System Administrator'
                admin_user.role = User.Role.ADMIN
                admin_user.status = User.Status.APPROVED
                admin_user.is_staff = True
                admin_user.is_superuser = True
                admin_user.is_active = True
                admin_user.is_deleted = False
                admin_user.two_factor_enabled = False
                admin_user.set_password(admin_pass)
                admin_user.save()

            # 2. Dedicated Demo Doctor Account
            doc_email = 'doctor@medicare.local'
            doc_pass = 'Doctor@Medicare2026!'
            doc_user = User.all_objects.filter(email=doc_email).first()

            if not doc_user:
                doc_user = User.objects.create_user(
                    email=doc_email,
                    password=doc_pass,
                    full_name='Dr. Sarah Jenkins',
                    phone='+18005550122',
                    role=User.Role.DOCTOR,
                    status=User.Status.APPROVED
                )
            else:
                doc_user.full_name = 'Dr. Sarah Jenkins'
                doc_user.role = User.Role.DOCTOR
                doc_user.status = User.Status.APPROVED
                doc_user.is_active = True
                doc_user.is_deleted = False
                doc_user.two_factor_enabled = False
                doc_user.set_password(doc_pass)
                doc_user.save()

            doc_profile, _ = Doctor.all_objects.get_or_create(user=doc_user)
            doc_profile.specialty = Doctor.Specialty.CARDIOLOGY
            doc_profile.qualification = 'MD, FACC - Harvard Medical School'
            doc_profile.experience_years = 12
            doc_profile.license_number = 'MD-CARDIO-88921'
            doc_profile.is_verified = True
            doc_profile.consultation_fee = 75.00
            doc_profile.available_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            doc_profile.available_time_start = time(9, 0)
            doc_profile.available_time_end = time(17, 0)
            doc_profile.is_deleted = False
            doc_profile.save()

            # Also update existing doctor account if present
            siam_user = User.all_objects.filter(email='mashhood.siam@gmail.com').first()
            if siam_user:
                siam_user.role = User.Role.DOCTOR
                siam_user.status = User.Status.APPROVED
                siam_user.is_active = True
                siam_user.is_deleted = False
                siam_user.two_factor_enabled = False
                siam_user.set_password(doc_pass)
                siam_user.save()
                siam_profile, _ = Doctor.all_objects.get_or_create(user=siam_user)
                siam_profile.is_verified = True
                siam_profile.available_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                siam_profile.available_time_start = time(9, 0)
                siam_profile.available_time_end = time(17, 0)
                siam_profile.is_deleted = False
                siam_profile.save()

            # 3. Dedicated Demo Patient Account
            pat_email = 'patient@medicare.local'
            pat_pass = 'Patient@Medicare2026!'
            pat_user = User.all_objects.filter(email=pat_email).first()

            if not pat_user:
                pat_user = User.objects.create_user(
                    email=pat_email,
                    password=pat_pass,
                    full_name='Johnathan Doe',
                    phone='+18005550133',
                    role=User.Role.PATIENT,
                    status=User.Status.APPROVED
                )
            else:
                pat_user.full_name = 'Johnathan Doe'
                pat_user.role = User.Role.PATIENT
                pat_user.status = User.Status.APPROVED
                pat_user.is_active = True
                pat_user.is_deleted = False
                pat_user.two_factor_enabled = False
                pat_user.set_password(pat_pass)
                pat_user.save()

            pat_profile, _ = Patient.all_objects.get_or_create(user=pat_user)
            pat_profile.date_of_birth = date(1992, 6, 15)
            pat_profile.gender = Patient.Gender.MALE
            pat_profile.blood_group = 'O+'
            pat_profile.emergency_contact = '+18005550190'
            pat_profile.emergency_contact_name = 'Jane Doe'
            pat_profile.allergies = 'Penicillin, Peanuts'
            pat_profile.chronic_conditions = 'Mild Hypertension'
            pat_profile.is_deleted = False
            pat_profile.save()

            # Also update existing patient account if present
            mashudh_user = User.all_objects.filter(email='ahmed.mashudh@gmail.com').first()
            if mashudh_user:
                mashudh_user.role = User.Role.PATIENT
                mashudh_user.status = User.Status.APPROVED
                mashudh_user.is_active = True
                mashudh_user.is_deleted = False
                mashudh_user.two_factor_enabled = False
                mashudh_user.set_password(pat_pass)
                mashudh_user.save()

            # Record AuditLog
            AuditLog.objects.create(
                user=admin_user,
                action=AuditLog.Action.CREATE,
                resource_type='System',
                details={'note': 'Demo accounts seeded via seed_demo_users command'}
            )

        self.stdout.write(self.style.MIGRATE_HEADING('\n======================================================='))
        self.stdout.write(self.style.MIGRATE_HEADING('           MEDICARE — SEEDED DEMO ACCOUNTS             '))
        self.stdout.write(self.style.MIGRATE_HEADING('======================================================='))
        self.stdout.write(self.style.SUCCESS('[ADMINISTRATOR]'))
        self.stdout.write(f'  Email:     {admin_email}')
        self.stdout.write(f'  Password:  {admin_pass}')
        self.stdout.write(f'  Role:      admin\n')

        self.stdout.write(self.style.SUCCESS('[DOCTOR (DEMO)]'))
        self.stdout.write(f'  Email:     {doc_email}')
        self.stdout.write(f'  Password:  {doc_pass}')
        self.stdout.write(f'  Name:      Dr. Sarah Jenkins (Cardiology)')
        self.stdout.write(f'  Verified:  True\n')

        self.stdout.write(self.style.SUCCESS('[PATIENT (DEMO)]'))
        self.stdout.write(f'  Email:     {pat_email}')
        self.stdout.write(f'  Password:  {pat_pass}')
        self.stdout.write(f'  Name:      Johnathan Doe\n')

        self.stdout.write(self.style.SUCCESS('[EXISTING REGISTERED ACCOUNTS UPDATED]'))
        self.stdout.write(f'  mashhood.siam@gmail.com  -> Password: {doc_pass} (Approved Doctor)')
        self.stdout.write(f'  ahmed.mashudh@gmail.com  -> Password: {pat_pass} (Approved Patient)')
        self.stdout.write(self.style.MIGRATE_HEADING('=======================================================\n'))
