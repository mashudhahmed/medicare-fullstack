from rest_framework import serializers
from apps.models.billing import Billing
from .patient_schema import PatientSerializer


class BillingSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)

    class Meta:
        model = Billing
        fields = [
            'id', 'patient', 'patient_details',
            'invoice_number', 'amount', 'tax', 'discount',
            'total_amount', 'status', 'payment_method',
            'due_date', 'paid_at', 'description',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'total_amount', 'created_at', 'updated_at']


class CreateBillingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Billing
        fields = [
            'patient', 'amount', 'tax', 'discount',
            'due_date', 'description'
        ]