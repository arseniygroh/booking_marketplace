from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

def test_api(request):
    return JsonResponse({"message": "Hello from Django!"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('test/', test_api), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
