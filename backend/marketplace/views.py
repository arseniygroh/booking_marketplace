from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Property, User

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