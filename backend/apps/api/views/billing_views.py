from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.models.billing import Billing
from apps.schemas.billing_schema import BillingSerializer, CreateBillingSerializer
from apps.core.permissions import IsAdmin


class ListCreateBillingView(generics.ListCreateAPIView):
    """List all billings or create new (Admin only for list)"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Billing.objects.filter(is_deleted=False)
        elif user.role == 'patient':
            return Billing.objects.filter(patient__user=user, is_deleted=False)
        return Billing.objects.none()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateBillingSerializer
        return BillingSerializer

    def perform_create(self, serializer):
        serializer.save(status='pending')


class BillingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, delete billing"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BillingSerializer
    queryset = Billing.objects.filter(is_deleted=False)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        return Response({
            'message': 'Billing record deleted successfully'
        }, status=status.HTTP_200_OK)


class MyBillingView(generics.ListAPIView):
    """Get current user's billing records"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BillingSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return Billing.objects.filter(patient__user=user, is_deleted=False)
        return Billing.objects.none()


class PayBillingView(APIView):
    """Mark billing as paid"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            billing = Billing.objects.get(id=pk, is_deleted=False)
        except Billing.DoesNotExist:
            return Response({
                'error': 'Billing record not found'
            }, status=status.HTTP_404_NOT_FOUND)

        if billing.status != 'pending':
            return Response({
                'error': f'Cannot pay billing with status: {billing.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        billing.status = 'paid'
        billing.save()

        return Response({
            'message': 'Billing paid successfully'
        }, status=status.HTTP_200_OK)