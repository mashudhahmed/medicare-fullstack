"""
Role-based and object-level permissions.

IMPORTANT: User.Role values in the model are lowercase:
  'admin', 'doctor', 'patient'
Always compare against those values.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


def _role(user) -> str | None:
    """Return the user's role string (lowercase) or None."""
    return getattr(user, "role", None)


def _is_admin(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and user.is_active
        and (
            user.is_staff
            or user.is_superuser
            or _role(user) == "admin"
        )
    )


class IsAuthenticatedUser(BasePermission):
    """Ensures the requesting user is authenticated and active."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
        )


class IsAdminOrStaff(BasePermission):
    """Grants access to superusers, staff, or users with the admin role."""

    def has_permission(self, request, view):
        return _is_admin(request.user)


# Alias used throughout the views (admin_views, patient_views, billing, etc.)
IsAdmin = IsAdminOrStaff


class IsDoctor(BasePermission):
    """Grants access to active doctors and platform administrators."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_active):
            return False
        if _is_admin(user):
            return True
        return _role(user) == "doctor"


class IsPatient(BasePermission):
    """Grants access to active patients and platform administrators."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_active):
            return False
        if _is_admin(user):
            return True
        return _role(user) == "patient"


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level: allow if the user owns the object (or is linked via .user)
    or is an admin/staff.
    Used by PatientDetailView / DoctorDetailView.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
        )

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated and user.is_active):
            return False

        if _is_admin(user):
            return True

        # Direct user match
        if obj == user:
            return True

        # Profile models (Patient / Doctor) that have a .user FK
        owner = getattr(obj, "user", None)
        if owner is not None and owner == user:
            return True

        return False


class IsOwnerOrDoctorOrAdmin(BasePermission):
    """
    Object-level permission for medical records, appointments, billing, etc.

    - Admins / staff: full access
    - Assigned doctor: full access
    - Patient / owner: read-only (unless view.allow_patient_mutation = True)
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated and user.is_active):
            return False

        if _is_admin(user):
            return True

        if obj == user:
            return True

        patient_user = (
            getattr(getattr(obj, "patient", None), "user", None)
            or getattr(obj, "patient", None)
        )
        doctor_user = (
            getattr(getattr(obj, "doctor", None), "user", None)
            or getattr(obj, "doctor", None)
        )

        if patient_user == user:
            if request.method in SAFE_METHODS or getattr(
                view, "allow_patient_mutation", False
            ):
                return True

        if doctor_user == user:
            return True

        if getattr(obj, "user", None) == user:
            return True

        return False


class ReadOnly(BasePermission):
    """Restricts access to safe methods only (GET, HEAD, OPTIONS)."""

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS
