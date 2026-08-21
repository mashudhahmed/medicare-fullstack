"""
Production settings – 2026 hardened configuration.
"""
from .base import *  # noqa: F401, F403
import os

DEBUG = False

# ---------------------------------------------------------------------------
# Hosts & CORS – must be explicit
# ---------------------------------------------------------------------------
ALLOWED_HOSTS = [
    h.strip() for h in os.getenv('ALLOWED_HOSTS', '').split(',') if h.strip()
]
if not ALLOWED_HOSTS:
    raise ValueError("ALLOWED_HOSTS must be set in production")

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv('CORS_ALLOWED_ORIGINS', '').split(',') if o.strip()
]

# ---------------------------------------------------------------------------
# Security hardening
# ---------------------------------------------------------------------------
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1', 'yes')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Session
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# ---------------------------------------------------------------------------
# Database – require SSL in production
# ---------------------------------------------------------------------------
DATABASES['default']['OPTIONS']['sslmode'] = os.getenv('DB_SSLMODE', 'require')  # noqa: F405

# ---------------------------------------------------------------------------
# Static files (WhiteNoise recommended)
# ---------------------------------------------------------------------------
try:
    import whitenoise  # noqa: F401
    MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')  # noqa: F405
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
except ImportError:
    pass

# ---------------------------------------------------------------------------
# Throttling – stricter in production
# ---------------------------------------------------------------------------
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {  # noqa: F405
    'anon': '60/hour',
    'user': '500/hour',
}

# ---------------------------------------------------------------------------
# Logging – more visible errors
# ---------------------------------------------------------------------------
LOGGING['root']['level'] = os.getenv('LOG_LEVEL', 'WARNING')  # noqa: F405
LOGGING['loggers']['django.request']['level'] = 'ERROR'  # noqa: F405

# ---------------------------------------------------------------------------
# Sentry (optional – set SENTRY_DSN)
# ---------------------------------------------------------------------------
SENTRY_DSN = os.getenv('SENTRY_DSN')
if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.redis import RedisIntegration

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[DjangoIntegration(), RedisIntegration()],
            traces_sample_rate=float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
            send_default_pii=False,
            environment=os.getenv('ENV', 'production'),
        )
    except ImportError:
        pass

print(">>> Running with PRODUCTION settings")