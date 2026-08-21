"""
Settings package.

Default to development. Override with:
  DJANGO_SETTINGS_MODULE=healthcare_project.settings.production
"""
from .development import *  # noqa: F401, F403