from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
import uuid
from .managers import SoftDeleteUserManager


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        PATIENT = 'patient', 'Patient'
        DOCTOR = 'doctor', 'Doctor'
        ADMIN = 'admin', 'Administrator'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        SUSPENDED = 'suspended', 'Suspended'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, unique=True, db_index=True, null=True, blank=True)
    address = models.TextField(blank=True, null=True)

    # Profile picture
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    profile_picture_public_id = models.CharField(max_length=255, blank=True, null=True)

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PATIENT, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    last_login = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    # Two-Factor Authentication (TOTP)
    totp_secret = models.CharField(max_length=64, blank=True, null=True)
    two_factor_enabled = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    # Managers – SoftDeleteUserManager has create_user / create_superuser
    objects = SoftDeleteUserManager()
    all_objects = models.Manager()

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email', 'status']),
            models.Index(fields=['role', 'status']),
            models.Index(fields=['is_deleted']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return self.email

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.is_active = True
        self.save()

    def get_full_name(self):
        return self.full_name or self.email

    def get_short_name(self):
        return self.full_name.split()[0] if self.full_name else self.email

    @property
    def is_patient(self):
        return self.role == self.Role.PATIENT

    @property
    def is_doctor(self):
        return self.role == self.Role.DOCTOR

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN
