from django.db import models


class SoftDeleteManager(models.Manager):
    """
    Manager that returns only non-deleted objects by default.
    Use .all_objects to get all objects including deleted.
    Use .deleted_only() to get only deleted objects.
    """
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def all_with_deleted(self):
        """Returns all objects including soft-deleted ones."""
        return super().get_queryset()

    def deleted_only(self):
        """Returns only soft-deleted objects."""
        return super().get_queryset().filter(is_deleted=True)