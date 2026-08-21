from datetime import datetime, timedelta
from django.utils import timezone
from apps.models.models import Appointment, DoctorAvailability

class AppointmentService:
    
    @staticmethod
    def get_available_slots(doctor_id, date_str):
        """Get available slots for a doctor on a given date."""
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            day = date.weekday()
            
            doctor = DoctorAvailability.objects.filter(
                doctor_id=doctor_id,
                day=day,
                is_active=True
            )
            
            if not doctor.exists():
                return []
            
            slots = []
            for availability in doctor:
                current = availability.start_time
                while current < availability.end_time:
                    is_booked = Appointment.objects.filter(
                        doctor_id=doctor_id,
                        date=date,
                        start_time=current,
                        status__in=['pending', 'confirmed', 'in_progress']
                    ).exists()
                    
                    if not is_booked:
                        slots.append(current.strftime('%H:%M'))
                    
                    current = (datetime.combine(datetime.today(), current) + 
                              timedelta(minutes=availability.slot_duration)).time()
            
            return slots
        except Exception as e:
            return []
