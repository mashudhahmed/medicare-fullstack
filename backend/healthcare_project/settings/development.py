"""
Development settings.
"""
import os
from .base import *  # noqa: F401, F403

DEBUG = True

# Allow all origins in development for convenience
CORS_ALLOW_ALL_ORIGINS = True

# More permissive CSP for Swagger / admin / Vite HMR
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "'unsafe-eval'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_CONNECT_SRC = ("'self'", "http://localhost:*", "ws://localhost:*", "http://127.0.0.1:*")

# Show browsable API in development
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (  # noqa: F405
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
)

# Optional: Django Debug Toolbar
try:
    import debug_toolbar  # noqa: F401
    INSTALLED_APPS += ['debug_toolbar']  # noqa: F405
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')  # noqa: F405
    INTERNAL_IPS = ['127.0.0.1', 'localhost']
except ImportError:
    pass

# Relax Axes a bit for local testing
AXES_ENABLED = os.getenv('AXES_ENABLED', 'True').lower() in ('true', '1', 'yes')

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

print(">>> Running with DEVELOPMENT settings")