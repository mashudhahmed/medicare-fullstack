"""
Development settings.
"""
import os
from .base import *  # noqa: F401, F403

DEBUG = True

# Allow all origins in development for convenience and define explicit allowed origins
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173'
    ).split(',')
    if origin.strip()
]

# In development, default to local in-memory cache and channels unless REDIS_URL is explicitly set
if not os.getenv('REDIS_URL'):
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'medicare-dev-cache',
        }
    }
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        }
    }

# More permissive CSP for Swagger / admin / Vite HMR
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "'unsafe-eval'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_CONNECT_SRC = ("'self'", "http://localhost:*", "ws://localhost:*", "http://127.0.0.1:*", "ws://127.0.0.1:*")

# Show browsable API in development
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (  # noqa: F405
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
)

# Optional: Django Debug Toolbar (only if explicitly enabled to avoid interfering with API responses)
if os.getenv('ENABLE_DEBUG_TOOLBAR', 'False').lower() in ('true', '1', 'yes'):
    try:
        import debug_toolbar  # noqa: F401
        INSTALLED_APPS += ['debug_toolbar']  # noqa: F405
        cors_idx = MIDDLEWARE.index('corsheaders.middleware.CorsMiddleware') if 'corsheaders.middleware.CorsMiddleware' in MIDDLEWARE else -1
        MIDDLEWARE.insert(cors_idx + 1 if cors_idx != -1 else 0, 'debug_toolbar.middleware.DebugToolbarMiddleware')  # noqa: F405
        INTERNAL_IPS = ['127.0.0.1', 'localhost']
        DEBUG_TOOLBAR_CONFIG = {
            'SHOW_TOOLBAR_CALLBACK': lambda request: not request.path.startswith('/api/'),
        }
    except ImportError:
        pass

# Relax Axes a bit for local testing
AXES_ENABLED = os.getenv('AXES_ENABLED', 'True').lower() in ('true', '1', 'yes')

# Email: If EMAIL_HOST_USER is provided in .env, use SMTP backend; otherwise default to console
if os.getenv('EMAIL_HOST_USER'):
    EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
else:
    EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')

print(">>> Running with DEVELOPMENT settings")
