from celery import shared_task
from datetime import datetime
from django.conf import settings
from django.core.mail import send_mail
from .models import Booking

FROM_EMAIL = getattr(settings, 'DEFAULT_FROM_EMAIL')


@shared_task
def send_review_request_email(booking_id):
    try:
        booking = Booking.objects.select_related('property', 'owner').get(id=booking_id)
        send_mail(
            subject=f"How was your stay at {booking.property.title}?",
            message=(
                f"Hi {booking.owner.username},\n\n"
                f"We hope you had a great trip to {booking.property.title}! "
                f"Please take a moment to leave a review for your host."
            ),
            from_email=FROM_EMAIL,
            recipient_list=[booking.owner.email],
            fail_silently=False,
        )
    except Booking.DoesNotExist:
        return f"Booking {booking_id} no longer exists."


@shared_task
def send_confirmation_email(booking_id):
    try:
        booking = Booking.objects.select_related('property', 'owner').get(id=booking_id)
        send_mail(
            subject=f"Reservation Confirmed: {booking.property.title}",
            message=(
                f"Hi {booking.owner.username},\n\n"
                f"Your trip to {booking.property.title} is officially confirmed! "
                f"Check-in date: {booking.check_in}.\n\n"
                f"Safe travels!"
            ),
            from_email=FROM_EMAIL,
            recipient_list=[booking.owner.email],
            fail_silently=False,
        )
    except Booking.DoesNotExist:
        return f"Booking {booking_id} no longer exists."


@shared_task
def complete_past_bookings():
    today = datetime.now().date()
    
    past_booking_ids = list(
        Booking.objects.filter(
            status=Booking.Status.CONFIRMED,
            check_out__lt=today
        ).values_list('id', flat=True)
    )

    if not past_booking_ids:
        return "No bookings to complete today."

    Booking.objects.filter(id__in=past_booking_ids).update(
        status=Booking.Status.COMPLETED
    )
    
    for booking_id in past_booking_ids:
        send_review_request_email.delay(booking_id)

    return f"Successfully marked {len(past_booking_ids)} bookings as COMPLETED and dispatched review emails."