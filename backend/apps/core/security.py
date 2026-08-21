import hashlib
import hmac
import secrets
from django.conf import settings

def generate_secure_token(length=32):
    """Generate a secure random token."""
    return secrets.token_urlsafe(length)

def hash_token(token):
    """Hash a token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()

def verify_token(token, hashed_token):
    """Verify a token against its hash."""
    return hmac.compare_digest(hash_token(token), hashed_token)

def generate_verification_code(length=6):
    """Generate a numeric verification code."""
    return ''.join(secrets.choice('0123456789') for _ in range(length))