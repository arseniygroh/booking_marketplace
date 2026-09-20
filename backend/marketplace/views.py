from django.shortcuts import render
import json
from django.core.exceptions import ValidationError
from datetime import datetime
from decimal import Decimal
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Property, Booking, User

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
def get_property(request, propeprty_id):
    try:
        property = Property.objects.get(id=propeprty_id)
        image_urls = [] 

        for img in property.images.all():
            if img and img.image and img.image.url:
                image_urls.append(request.build_absolute_uri(img.image.url))
        
        data = {
            "id": propeprty_id,
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

            booking = Booking.objects.create(
                owner=user_obj,
                property=property_obj,
                check_in=check_in,
                check_out=check_out,
                total_price=total_price,
                status=Booking.Status.CONFIRMED
            ).clean()

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