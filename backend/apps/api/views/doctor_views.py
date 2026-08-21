from rest_framework import generics, permissions, status
from rest_framework.response import Response
from apps.models.doctor import Doctor
from apps.schemas.doctor_schema import DoctorSerializer
from apps.core.permissions import IsDoctor, IsAdmin, IsOwnerOrAdmin


class ListDoctorsView(generics.ListAPIView):
    """List all doctors"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DoctorSerializer
    queryset = Doctor.objects.filter(is_deleted=False, is_verified=True)


class DoctorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, delete doctor"""
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    serializer_class = DoctorSerializer
    queryset = Doctor.objects.filter(is_deleted=False)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete()
        return Response({
            'message': 'Doctor record deleted successfully'
        }, status=status.HTTP_200_OK)


class MyDoctorProfileView(generics.RetrieveUpdateAPIView):
    """Get or update current doctor's profile"""
    permission_classes = [permissions.IsAuthenticated, IsDoctor]
    serializer_class = DoctorSerializer

    def get_object(self):
        return self.request.user.doctor_profile