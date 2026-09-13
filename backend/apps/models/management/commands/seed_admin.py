import os
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.models.user import User
from apps.models.audit_log import AuditLog
from apps.utils.audit import log_audit


class Command(BaseCommand):
    help = 'Seeds a default administrator account in an idempotent and professional manner.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default=os.getenv('ADMIN_DEFAULT_EMAIL', 'admin@medicare.local'),
            help='Administrator email address'
        )
        parser.add_argument(
            '--password',
            type=str,
            default=os.getenv('ADMIN_DEFAULT_PASSWORD', 'Admin@Medicare2026!'),
            help='Administrator password'
        )
        parser.add_argument(
            '--name',
            type=str,
            default=os.getenv('ADMIN_DEFAULT_NAME', 'System Administrator'),
            help='Administrator full name'
        )
        parser.add_argument(
            '--phone',
            type=str,
            default=os.getenv('ADMIN_DEFAULT_PHONE', '+18005550199'),
            help='Administrator phone number'
        )

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        password = options['password']
        name = options['name'].strip()
        phone = options['phone'].strip()

        self.stdout.write(self.style.NOTICE(f'--> Checking for admin account: {email}...'))

        with transaction.atomic():
            user = User.all_objects.filter(email=email).first()

            if user:
                # Update existing user to superuser/admin
                user.full_name = name
                user.role = User.Role.ADMIN
                user.status = User.Status.APPROVED
                user.is_staff = True
                user.is_superuser = True
                user.is_active = True
                user.is_deleted = False
                user.deleted_at = None
                user.set_password(password)
                user.save()

                AuditLog.objects.create(
                    user=user,
                    action=AuditLog.Action.UPDATE,
                    resource_type='User',
                    resource_id=str(user.id),
                    details={'note': 'Admin account refreshed via seed_admin command'}
                )

                self.stdout.write(self.style.SUCCESS(f'Successfully updated existing user {email} to Administrator.'))
            else:
                # Create brand new superuser
                user = User.objects.create_superuser(
                    email=email,
                    password=password,
                    full_name=name,
                    phone=phone,
                    role=User.Role.ADMIN,
                    status=User.Status.APPROVED
                )

                AuditLog.objects.create(
                    user=user,
                    action=AuditLog.Action.CREATE,
                    resource_type='User',
                    resource_id=str(user.id),
                    details={'note': 'Admin account provisioned via seed_admin command'}
                )

                self.stdout.write(self.style.SUCCESS(f'Successfully created new Administrator account: {email}'))

        self.stdout.write(self.style.MIGRATE_HEADING('\n==================================================='))
        self.stdout.write(self.style.MIGRATE_HEADING('    MEDICARE HUB — ADMINISTRATOR CREDENTIALS       '))
        self.stdout.write(self.style.MIGRATE_HEADING('==================================================='))
        self.stdout.write(f'  Email:     {email}')
        self.stdout.write(f'  Password:  {password}')
        self.stdout.write(f'  Role:      admin')
        self.stdout.write(f'  Status:    approved')
        self.stdout.write(f'  Staff:     True')
        self.stdout.write(f'  Superuser: True')
        self.stdout.write(self.style.MIGRATE_HEADING('===================================================\n'))
