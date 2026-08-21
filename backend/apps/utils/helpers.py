import re
import uuid
from datetime import datetime, timedelta


def generate_invoice_number():
    """Generate a unique invoice number"""
    timestamp = datetime.now().strftime('%Y%m%d')
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"INV-{timestamp}-{unique_id}"


def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone):
    """Validate phone number (BD format)"""
    pattern = r'^(\+8801|01)[3-9]\d{8}$'
    return re.match(pattern, phone) is not None


def get_date_range(days=30):
    """Get date range for the last N days"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    return start_date, end_date


def calculate_age(birth_date):
    """Calculate age from birth date"""
    today = datetime.now().date()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def mask_email(email):
    """Mask email for privacy"""
    if not email:
        return email
    parts = email.split('@')
    if len(parts) != 2:
        return email
    username = parts[0]
    if len(username) <= 2:
        return email
    masked = username[:2] + '***' + username[-1] + '@' + parts[1]
    return masked


def mask_phone(phone):
    """Mask phone number for privacy"""
    if not phone:
        return phone
    if len(phone) <= 4:
        return phone
    return phone[:3] + '***' + phone[-2:]


def format_currency(amount):
    """Format amount as currency"""
    return f"${amount:,.2f}"


def generate_otp():
    """Generate a 6-digit OTP"""
    import random
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])