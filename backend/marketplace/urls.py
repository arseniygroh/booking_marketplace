from django.urls import path
from . import views

urlpatterns = [
    path('properties/', views.get_properties),
    path('bookings/create/', views.create_booking),
    path('properties/<int:id>/', views.get_property),
    path('login/', views.login_view),
    path('register/', views.register_view),
    path('logout/', views.logout_view),
    path('me/', views.get_current_user),
    path('bookings/my/', views.get_user_bookings),
    path('properties/<int:property_id>/booked-dates/', views.get_unavailable_dates),
]