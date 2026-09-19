from django.db import models
from django.contrib.auth.models import AbstractUser

def user_avatars_directory_path(instance, filename):
    return f'avatars/user_{instance.id}/{filename}'


class User(AbstractUser):    
    is_host = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to=user_avatars_directory_path, null=True, blank=True)
    
    def __str__(self):
        return self.username
