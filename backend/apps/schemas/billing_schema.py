from rest_framework import serializers
from apps.models.billing import Invoice, Payment
from django.utils import timezone

class InvoiceSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'invoice_number')

class InvoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ('patient', 'appointment', 'amount', 'tax', 'description', 'items', 'due_date')
    
    def create(self, validated_data):
        from apps.utils import generate_invoice_number
        validated_data['invoice_number'] = generate_invoice_number()
        validated_data['total_amount'] = validated_data['amount'] + validated_data.get('tax', 0)
        return super().create(validated_data)

class PaymentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'transaction_id')

class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ('invoice', 'amount', 'payment_method')
    
    def validate(self, data):
        invoice = data.get('invoice')
        amount = data.get('amount')
        
        if invoice and amount > invoice.total_amount:
            raise serializers.ValidationError("Payment amount cannot exceed invoice total.")
        
        if invoice and invoice.status == 'paid':
            raise serializers.ValidationError("Invoice is already paid.")
        
        return data
    
    def create(self, validated_data):
        from apps.utils import generate_uuid
        validated_data['transaction_id'] = f"TXN-{generate_uuid()[:8].upper()}"
        validated_data['patient'] = self.context['request'].user.patient_profile
        validated_data['status'] = 'pending'
        return super().create(validated_data)