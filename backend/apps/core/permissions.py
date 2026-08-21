"""
Role-based permission classes for MediCare Hub.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsPatient(BasePermission):
    """Allows access only to users with role = patient."""
    message = "Only patients can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'patient'
        )


class IsDoctor(BasePermission):
    """Allows access only to users with role = doctor."""
    message = "Only doctors can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'doctor'
        )


class IsAdmin(BasePermission):
    """Allows access only to users with role = admin (or Django staff/superuser)."""
    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return (
            getattr(user, 'role', None) == 'admin'
            or user.is_staff
            or user.is_superuser
        )


class IsPatientOrDoctor(BasePermission):
    """Patient or Doctor."""
    message = "Only patients or doctors can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in ('patient', 'doctor')
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level: owner of the object or admin.
    Expects the object to have a `user` attribute or to be the user itself.
    """
    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, 'role', None) == 'admin' or user.is_staff or user.is_superuser:
            return True
        # Direct user object
        if obj == user:
            return True
        # Common related field
        owner = getattr(obj, 'user', None)
        if owner is not None:
            return owner == user
        # Patient / Doctor profile patterns
        for attr in ('patient', 'doctor'):
            related = getattr(obj, attr, None)
            if related is not None and getattr(related, 'user', None) == user:
                return True
        return False


class ReadOnly(BasePermission):
    """Allow read-only methods for anyone authenticated."""
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS