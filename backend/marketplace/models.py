from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator

def user_avatars_directory_path(instance, filename):
    return f'avatars/user_{instance.id}/{filename}'

def property_image_upload_path(instance, filename):
    return f'properties/property_{instance.property.id}/{filename}'

class User(AbstractUser):    
    is_host = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to=user_avatars_directory_path, null=True, blank=True)

    def __str__(self):
        return self.username
    
class Amenity(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name

class Property(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='properties')
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    max_guests = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    amenities = models.ManyToManyField(Amenity, related_name='properties', blank=True)

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
        

class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=property_image_upload_path)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.property.title}"
    

class Review(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='authored_reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.booking.owner != self.author:
            raise ValidationError("Only the guest of this booking can leave a review.")
        if self.booking.status != Booking.Status.COMPLETED:
            raise ValidationError("Reviews can only be left for completed bookings.")

    def __str__(self):
        return f"{self.rating} Star Review by {self.author.name}"