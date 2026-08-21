from django.db import models
from django.conf import settings

class AdminProfile(models.Model):
    """
    Admin profile model - extends the User model for admin-specific fields
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_profile'
    )
    department = models.CharField(max_length=100, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    permissions = models.JSONField(default=list, blank=True)  # Custom permissions
    can_approve_doctors = models.BooleanField(default=True)
    can_manage_users = models.BooleanField(default=True)
    can_view_reports = models.BooleanField(default=True)
    can_manage_billing = models.BooleanField(default=True)
    can_manage_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'admin_profiles'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['department']),
        ]
    
    def __str__(self):
        return f"Admin: {self.user.get_full_name()}"
    
    def has_permission(self, permission):
        """Check if admin has a specific permission"""
        return permission in self.permissions
    
    def add_permission(self, permission):
        """Add a permission to the admin"""
        if permission not in self.permissions:
            self.permissions.append(permission)
            self.save()
    
    def remove_permission(self, permission):
        """Remove a permission from the admin"""
        if permission in self.permissions:
            self.permissions.remove(permission)
            self.save()

class SystemLog(models.Model):
    """
    System audit log for tracking admin actions
    """
    ACTION_TYPES = (
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('setting', 'Setting Change'),
    )
    
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='system_logs')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'system_logs'
        indexes = [
            models.Index(fields=['admin']),
            models.Index(fields=['action_type']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.admin.username} - {self.action_type} - {self.model_name} - {self.created_at}"