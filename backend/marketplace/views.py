import json
from django.core.exceptions import ValidationError
from datetime import datetime
from decimal import Decimal
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Property, Booking
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
import re

User = get_user_model()

@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    try:
        user_data = json.loads(request.body)
        email = user_data.get("email")
        password = user_data.get("password")
        
        user = User.objects.get(email=email)

        if not user.check_password(password):
            return JsonResponse({"error": "Passwords don't match"}, status=401)
        
        login(request, user)
        return JsonResponse({
            "message": "Successfully logged in",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username
            }
        }, status=200)

    except User.DoesNotExist:
        return JsonResponse({"error": "User with such credentials doesn't exist"}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    logout(request)

    return JsonResponse({"message": "Successfully logged out"}, status=200)

@csrf_exempt
@require_http_methods(["POST"])
def register_view(request):
    try:
        email_pattern = re.compile(r"^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$", re.IGNORECASE)
        password_pattern = re.compile(r"^(?=.*\d).{8,}$")

        data = json.loads(request.body)
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        confirmed_password = data.get('confirmPassword')
    
        if not username or not password or not email:
            return JsonResponse({'error': 'username, email and password are necessary'}, status=400)

        if not email_pattern.match(email):
            return JsonResponse({"error": 'invalid email format'}, status=400)

        if not password_pattern.match(password):
            return JsonResponse({"error": 'invalid password format, it must include a digit and must be at least 8 characters long'}, status=400)
        
        if password != confirmed_password:
            return JsonResponse({"error": "Passwords must match"}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'User with such email already exists'}, status=400)
            
        try:
            validate_password(password)
        except ValidationError as e:
            return JsonResponse({'error': " ".join(e.messages)}, status=400)
        
        user = User.objects.create_user(username=username, email=email, password=password)
        
        return JsonResponse({
            'message': 'You were successfully registered!',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, status=201)  
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Internal server error: {str(e)}'}, status=500)


@require_http_methods(["GET"])
def get_properties(request):
    properties = Property.objects.prefetch_related('amenities', 'images').all()
    data = []
    
    for prop in properties:
        primary_image = prop.images.filter(is_primary=True).first()
        image_url = primary_image.image.url if primary_image and primary_image.image else None
        data.append({
            "id": prop.id,
            "title": prop.title,
            "description": prop.description,
            "location": prop.location,
            "price": str(prop.price),
            "max_guests": prop.max_guests,
            "amenities": [amenity.name for amenity in prop.amenities.all()],
            "primary_image": request.build_absolute_uri(image_url) if image_url else None,
            "owner": {
                "name": prop.owner.username,
                "email": prop.owner.email
            }
        })
        
    return JsonResponse(data, safe=False)

@require_http_methods(["GET"])
def get_property(request, id):
    try:
        property = Property.objects.get(id=id)
        image_urls = [] 

        for img in property.images.all():
            if img and img.image and img.image.url:
                image_urls.append(request.build_absolute_uri(img.image.url))
        
        data = {
            "id": id,
            "title": property.title,
            "description": property.description,
            "location": property.location,
            "price": str(property.price),
            "max_guests": property.max_guests,
            "amenities": [amenity.name for amenity in property.amenities.all()],
            "images_urls": image_urls,
            "owner": {
                "name": property.owner.username,
                "email": property.owner.email
            }
        }
        return JsonResponse(data)
    except Property.DoesNotExist:
        return JsonResponse({"error": "property is not found"}, status=404)
    

@csrf_exempt
@require_http_methods(["POST"])
def create_booking(request):
    try:
        data = json.loads(request.body)
        property_id = data.get("property_id")
        check_in_str = data.get("check_in")
        check_out_str = data.get("check_out")
        user_id = data.get("user_id")

        if not all([property_id, check_in_str, check_out_str, user_id]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        check_in = datetime.strptime(check_in_str, "%Y-%m-%d").date()
        check_out = datetime.strptime(check_out_str, "%Y-%m-%d").date()

        nights = (check_out - check_in).days

        with transaction.atomic():

            property_obj = Property.objects.select_for_update().get(id=property_id)
            user_obj = User.objects.get(id=user_id)

            has_conflicts = Booking.objects.filter(
                property=property_obj,
                status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED],
                check_in__lt=check_out,
                check_out__gt=check_in,
            ).exists()

            if has_conflicts:
                return JsonResponse({"error": "Dates are not available for this property"}, status=409)

            total_price = property_obj.price * Decimal(nights)

            booking = Booking(
                owner=user_obj,
                property=property_obj,
                check_in=check_in,
                check_out=check_out,
                total_price=total_price,
                status=Booking.Status.CONFIRMED
            )
            booking.clean() 
            booking.save()

            return JsonResponse({
                "message": "Booking has been successful",
                "booking": {
                    "id": booking.id,
                    "property_id": property_obj.id,
                    "check_in": booking.check_in.isoformat(),
                    "check_out": booking.check_out.isoformat(),
                    "total_price": str(booking.total_price),
                    "status": booking.status
                }
            }, status=201)

    except ValidationError:
        return JsonResponse({"error": "Check-out must be after check-in"}, status=400)
    except Property.DoesNotExist:
        return JsonResponse({"error": "Property not found"}, status=404)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except ValueError:
        return JsonResponse({"error": "Invalid date format. Expected YYYY-MM-DD"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)   
    

@require_http_methods(["GET"])
def get_current_user(request):
    if request.user.is_authenticated:
        return JsonResponse({
            "user": {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email
            }
        })
    return JsonResponse({"error": "Not authenticated"}, status=401)

@require_http_methods(["GET"])
def get_user_bookings(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    bookings = Booking.objects.filter(owner=request.user).select_related('property').prefetch_related('property__images')
    data = []

    for booking in bookings:
        primary_image = booking.property.images.filter(is_primary=True).first()
        image_url = primary_image.image.url if primary_image and primary_image.image else None
        data.append({
            "id": booking.id,
            "property_id": booking.property.id,
            "property_title": booking.property.title,
            "property_location": booking.property.location,
            "property_description": booking.property.description,
            "check_in": booking.check_in.isoformat(),
            "check_out": booking.check_out.isoformat(),
            "total_price": str(booking.total_price),
            "status": booking.status,
            "primary_image": request.build_absolute_uri(image_url) if image_url else None
        })

    return JsonResponse(data, safe=False)
