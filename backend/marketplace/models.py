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
