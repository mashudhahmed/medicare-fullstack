from apps.models.audit_log import AuditLog


def log_audit(request, action, resource_type, resource_id=None, details=None):
    """Utility to safely record an audit log entry."""
    try:
        user = getattr(request, 'user', None)
        if user and not user.is_authenticated:
            user = None

        ip_address = None
        user_agent = None
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

        return AuditLog.objects.create(
            user=user,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {}
        )
    except Exception:
        return None
