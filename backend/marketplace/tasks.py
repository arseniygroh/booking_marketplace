from celery import shared_task
from datetime import datetime
from .models import Booking

@shared_task
def complete_past_bookings():
    today = datetime.now().date()
    
    updated_count = Booking.objects.filter(
        status=Booking.Status.CONFIRMED,
        check_out__lt=today
    ).update(status=Booking.Status.COMPLETED)
    
    return f"Successfully marked {updated_count} bookings as COMPLETED."