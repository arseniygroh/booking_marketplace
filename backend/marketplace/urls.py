from django.urls import path
from . import views

urlpatterns = [
    path('properties/', views.get_properties),
    path('bookings/create/', views.create_booking),
]