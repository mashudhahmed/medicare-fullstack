import uuid
from datetime import datetime

def generate_uuid():
    """Generate a UUID string."""
    return str(uuid.uuid4())

def generate_invoice_number():
    """Generate a unique invoice number."""
    timestamp = datetime.now().strftime('%Y%m%d')
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"INV-{timestamp}-{unique_id}"

def format_currency(amount):
    """Format amount as currency."""
    return f"${amount:,.2f}"

def calculate_age(birth_date):
    """Calculate age from birth date."""
    today = datetime.now().date()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )