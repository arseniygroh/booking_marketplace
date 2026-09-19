from django.db import models
from django.contrib.auth.models import AbstractUser

def user_avatars_directory_path(instance, filename):
    return f'avatars/user_{instance.id}/{filename}'


class User(AbstractUser):    
    is_host = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to=user_avatars_directory_path, null=True, blank=True)

    def __str__(self):
        return self.username

class Property(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='properties')
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    max_guests = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PE', ('Pending')
        CONFIRMED = 'CO', ('Confirmed')
        CANCELLED = 'CA', ('Cancelled')
        COMPLETED = 'COM', ('Completed')

    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='bookings')
    check_in = models.DateField()
    check_out = models.DateField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=3,
        choices=Status.choices,
        default=Status.PENDING,
    )
    def clean(self):
        if self.check_in and self.check_out and self.check_in >= self.check_out:
            from django.core.exceptions import ValidationError
            raise ValidationError("Check-out must be after check-in")