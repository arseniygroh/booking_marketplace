import json
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Property, Booking, PropertyImage, Amenity
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
            "amenities": [{"id": amenity.id, "name": amenity.name, "description": amenity.description} for amenity in prop.amenities.all()],
            "primary_image": request.build_absolute_uri(image_url) if image_url else None,
            "owner": {
                "username": prop.owner.username,
                "email": prop.owner.email
            }
        })
        
    return JsonResponse(data, safe=False)

@require_http_methods(["GET"])
def get_property(request, id):
    try:
        property = Property.objects.get(id=id)
        images = [] 
        primary_image_index = None
        for idx, img in enumerate(property.images.all()):
            if img and img.image and img.image.url:
                if img.is_primary:
                    primary_image_index = idx
                images.append({"id": img.id, "previewUrl": request.build_absolute_uri(img.image.url)})
        
        data = {
            "id": id,
            "title": property.title,
            "description": property.description,
            "location": property.location,
            "price": str(property.price),
            "created_at": property.created_at.isoformat(),
            "max_guests": property.max_guests,
            "amenities": [{"id": amenity.id, "name": amenity.name, "description": amenity.description} for amenity in property.amenities.all()],
            "images": images,
            "primary_image_index": primary_image_index,
            "owner": {
                "username": property.owner.username,
                "email": property.owner.email
            }
        }
        return JsonResponse(data)
    except Property.DoesNotExist:
        return JsonResponse({"error": "property is not found"}, status=404)
    

@require_http_methods(["POST"])
def create_booking(request):
    try:
        data = json.loads(request.body)
        property_id = data.get("property_id")
        check_in_str = data.get("check_in")
        check_out_str = data.get("check_out")

        if not all([property_id, check_in_str, check_out_str]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        check_in = datetime.strptime(check_in_str, "%Y-%m-%d").date()
        check_out = datetime.strptime(check_out_str, "%Y-%m-%d").date()

        nights = (check_out - check_in).days

        with transaction.atomic():
            property_obj = Property.objects.select_for_update().get(id=property_id)
            if request.user == property_obj.owner:
                return JsonResponse({"error": "You cannot book your own property"}, status=403)

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
                owner=request.user,
                property=property_obj,
                check_in=check_in,
                check_out=check_out,
                total_price=total_price,
                status=Booking.Status.PENDING
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
            "booking_id": booking.id,
            "id": booking.property.id,
            "title": booking.property.title,
            "location": booking.property.location,
            "description": booking.property.description,
            "created_at": booking.created_at.isoformat(),
            "check_in": booking.check_in.isoformat(),
            "check_out": booking.check_out.isoformat(),
            "total_price": str(booking.total_price),
            "status": booking.status,
            "primary_image": request.build_absolute_uri(image_url) if image_url else None
        })

    return JsonResponse(data, safe=False)

@require_http_methods(["GET"])
def get_unavailable_dates(request, property_id):
    bookings = Booking.objects.filter(property=property_id, status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED])

    unavailable_dates = []

    for booking in bookings:
        current_date = booking.check_in
        while current_date < booking.check_out:
            unavailable_dates.append(current_date.isoformat())
            current_date += timedelta(days=1)
        
    return JsonResponse({"unavailable_dates": unavailable_dates})

@require_http_methods(["GET"])
def get_my_properties(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    properties = Property.objects.filter(owner=request.user).prefetch_related('amenities', 'images')
    data = []

    for prop in properties:
        image_urls = [] 
        for img in prop.images.all():
            if img and img.image and img.image.url:
                image_urls.append(request.build_absolute_uri(img.image.url))
                                
        data.append({
            "id": prop.id,
            "title": prop.title,
            "description": prop.description,
            "location": prop.location,
            "created_at": prop.created_at.isoformat(),
            "price": str(prop.price),
            "max_guests": prop.max_guests,
            "amenities": [{"id": amenity.id, "name": amenity.name, "description": amenity.description} for amenity in prop.amenities.all()],
            "images_urls": image_urls,
            "primary_image": image_urls[0] if image_urls else None,
        })

    return JsonResponse(data, safe=False)

@require_http_methods(["GET"])
def get_available_amenities(request):
    amenities = Amenity.objects.all()
    return JsonResponse([{"id": amenity.id, "name": amenity.name, "description": amenity.description} for amenity in amenities], safe=False)


@require_http_methods(["POST"])
def create_property(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)
    
    title = request.POST.get("title")
    description = request.POST.get('description')
    location = request.POST.get('location')
    price = request.POST.get('price')
    amenities_data = request.POST.getlist('amenities') 
    
    try:
        max_guests = int(request.POST.get('max_guests', 0))
        primary_image_index = int(request.POST.get('primary_image_index', 0))
    except ValueError:
        return JsonResponse({"error": "Invalid numbers sent"}, status=400)

    if not title or not location or not price or max_guests < 1:
        return JsonResponse({"error": "Invalid data was sent"}, status=400)
    
    new_property = Property.objects.create(
        owner=request.user,
        title=title,
        description=description,
        location=location,
        price=price,
        max_guests=max_guests
    )

    if amenities_data:
        new_property.amenities.set(amenities_data)
    
    images = request.FILES.getlist('images')
    for index, image_file in enumerate(images):
        is_primary = index == primary_image_index
        PropertyImage.objects.create(
            property=new_property,
            image=image_file,
            is_primary=is_primary
        )

    return JsonResponse({
        "message": "Property created successfully!",
        "property_id": new_property.id
    }, status=201)


@require_http_methods(["POST"])
def edit_property(request, property_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)
    
    property = Property.objects.filter(id=property_id, owner=request.user).first()
    if not property:
        return JsonResponse({"error": "Property not found or you do not have permission to edit it"}, status=404)
    
    title = request.POST.get("title")
    description = request.POST.get('description')
    location = request.POST.get('location')
    price = request.POST.get('price')
    
    try:
        max_guests = int(request.POST.get('max_guests', 0))
    except ValueError:
        max_guests = 0

    if not title or not location or not price or max_guests < 1:
        return JsonResponse({"error": "Invalid data was sent"}, status=400)
    
    property.title = title
    property.description = description
    property.location = location
    property.price = price
    property.max_guests = max_guests
    property.save()

    amenities_data = request.POST.getlist('amenities') 
    if amenities_data:
        property.amenities.set(amenities_data)
    else:
        property.amenities.clear()

    retained_image_ids = request.POST.getlist('retained_image_ids')
    if retained_image_ids:
        property.images.exclude(id__in=retained_image_ids).delete()
    else:
        property.images.all().delete()

    new_images = request.FILES.getlist('images')
    try:
        primary_image_index = int(request.POST.get('primary_image_index', -1))
    except ValueError:
        primary_image_index = -1

    newly_created_images = []
    for image_file in new_images:
        new_img = PropertyImage.objects.create(
            property=property,
            image=image_file,
            is_primary=False
        )
        newly_created_images.append(new_img)

    primary_image_id = request.POST.get('primary_image_id')
    property.images.all().update(is_primary=False)

    if primary_image_id:
        property.images.filter(id=primary_image_id).update(is_primary=True)
    elif primary_image_index >= 0 and primary_image_index < len(newly_created_images):
        new_primary = newly_created_images[primary_image_index]
        new_primary.is_primary = True
        new_primary.save()
    elif property.images.exists():
        first_img = property.images.first()
        first_img.is_primary = True
        first_img.save()

    return JsonResponse({"message": "Property updated successfully!"}, status=200)

@require_http_methods(["DELETE"])
def delete_property(request, property_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)
    
    property = Property.objects.filter(id=property_id, owner=request.user).first()
    
    if not property:
        return JsonResponse({"error": "Property not found or you do not have permission to delete it"}, status=404)
    
    for img in property.images.all():
        if img.image:
            img.image.delete(save=False) 

    property.delete()    
    return JsonResponse({"message": "Property deleted successfully!"}, status=200)

@require_http_methods(["POST"])
def cancel_booking(request, booking_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        booking = Booking.objects.get(id=booking_id, owner=request.user)
    except Booking.DoesNotExist:
        return JsonResponse({"error": "Booking not found"}, status=404)

    if booking.status == Booking.Status.CANCELLED:
        return JsonResponse({"error": "Booking is already cancelled"}, status=400)

    today = datetime.now().date()
    days_until = (booking.check_in - today).days
    
    if days_until < 1:
        return JsonResponse({"error": "Too late to cancel, or the booking has already passed."}, status=400)

    booking.status = Booking.Status.CANCELLED
    booking.save()

    return JsonResponse({"message": "Booking cancelled successfully!"}, status=200)

def confirm_booking(request, booking_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        booking = Booking.objects.get(id=booking_id, owner=request.user)
    except Booking.DoesNotExist:
        return JsonResponse({"error": "Booking not found"}, status=404)

    if booking.status != Booking.Status.PENDING:
        return JsonResponse({"error": f"Booking is already {booking.status}"}, status=400)

    expiration_time = booking.created_at + timedelta(minutes=5)
    
    if timezone.now() > expiration_time:
        booking.status = Booking.Status.EXPIRED
        booking.save()
        return JsonResponse({
            "error": "The 5-minute reservation window has expired.", 
        }, status=400)
    
    booking.status = Booking.Status.CONFIRMED
    booking.save()

    return JsonResponse({"message": "Booking confirmed successfully!"}, status=200)