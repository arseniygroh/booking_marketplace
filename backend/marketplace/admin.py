from django.contrib import admin
from .models import Review, Property, PropertyImage, User, Booking, Amenity


admin.site.register(Review)
admin.site.register(Property)
admin.site.register(User)
admin.site.register(PropertyImage)
admin.site.register(Booking)
admin.site.register(Amenity)
