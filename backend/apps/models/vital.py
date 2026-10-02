import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from .patient import Patient
from .user import User
from .managers import SoftDeleteManager


class PatientVital(models.Model):
    class GlucoseContext(models.TextChoices):
        FASTING = 'fasting', 'Fasting'
        POST_MEAL = 'post_meal', 'After Meal (Post-prandial)'
        RANDOM = 'random', 'Random'
        BEDTIME = 'bedtime', 'Bedtime'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='vitals')
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='recorded_vitals')

    # Blood Pressure (mmHg)
    systolic_bp = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(50), MaxValueValidator(260)],
        help_text="Systolic Blood Pressure (mmHg)"
    )
    diastolic_bp = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(30), MaxValueValidator(180)],
        help_text="Diastolic Blood Pressure (mmHg)"
    )

    # Heart / Pulse Rate (bpm)
    heart_rate = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(30), MaxValueValidator(250)],
        help_text="Heart rate / pulse (beats per minute)"
    )

    # Blood Glucose (mg/dL)
    blood_glucose = models.DecimalField(
        max_digits=5, decimal_places=1, null=True, blank=True,
        validators=[MinValueValidator(Decimal('20.0')), MaxValueValidator(Decimal('600.0'))],
        help_text="Blood glucose level (mg/dL)"
    )
    glucose_context = models.CharField(
        max_length=20, choices=GlucoseContext.choices, default=GlucoseContext.RANDOM
    )

    # Body Temperature (°F)
    body_temperature = models.DecimalField(
        max_digits=4, decimal_places=1, null=True, blank=True,
        validators=[MinValueValidator(Decimal('90.0')), MaxValueValidator(Decimal('110.0'))],
        help_text="Body temperature in Fahrenheit (°F)"
    )

    # Oxygen Saturation (SpO2 %)
    oxygen_saturation = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(50), MaxValueValidator(100)],
        help_text="Pulse oximeter oxygen saturation (% SpO2)"
    )

    # Anthropometrics
    weight_kg = models.DecimalField(
        max_digits=5, decimal_places=1, null=True, blank=True,
        validators=[MinValueValidator(Decimal('2.0')), MaxValueValidator(Decimal('350.0'))]
    )
    height_cm = models.DecimalField(
        max_digits=5, decimal_places=1, null=True, blank=True,
        validators=[MinValueValidator(Decimal('30.0')), MaxValueValidator(Decimal('260.0'))]
    )
    bmi = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    bmi_category = models.CharField(max_length=30, blank=True, default='')

    notes = models.TextField(blank=True, default='')
    recorded_at = models.DateTimeField(default=timezone.now, db_index=True)

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        db_table = 'patient_vitals'
        ordering = ['-recorded_at']
        indexes = [
            models.Index(fields=['patient', 'recorded_at']),
            models.Index(fields=['patient', 'is_deleted']),
        ]

    def __str__(self):
        return f"Vitals for {self.patient.user.full_name} on {self.recorded_at.strftime('%Y-%m-%d %H:%M')}"

    @property
    def bp_reading(self):
        if self.systolic_bp and self.diastolic_bp:
            return f"{self.systolic_bp}/{self.diastolic_bp}"
        return None

    def save(self, *args, **kwargs):
        # Auto-compute BMI if height and weight available
        if self.weight_kg and self.height_cm and self.height_cm > 0:
            height_m = self.height_cm / Decimal('100.0')
            raw_bmi = self.weight_kg / (height_m * height_m)
            self.bmi = round(raw_bmi, 1)

            if self.bmi < Decimal('18.5'):
                self.bmi_category = 'Underweight'
            elif self.bmi < Decimal('25.0'):
                self.bmi_category = 'Normal'
            elif self.bmi < Decimal('30.0'):
                self.bmi_category = 'Overweight'
            else:
                self.bmi_category = 'Obese'

        super().save(*args, **kwargs)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()
