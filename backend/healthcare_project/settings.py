"""
Backward-compatible entry point.
Prefer:
  healthcare_project.settings.development
  healthcare_project.settings.production
"""
from healthcare_project.settings.development import *  # noqa: F401, F403
