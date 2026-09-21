from django.urls import path
from . import views

urlpatterns = [
    path('properties/', views.get_properties),
    path('bookings/create/', views.create_booking),
    path('properties/<int:id>/', views.get_property),
    path('login/', views.login_view),
    path('register/', views.register_view),
    path('logout/', views.logout_view)
]