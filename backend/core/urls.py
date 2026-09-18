from django.contrib import admin
from django.urls import path
from django.http import JsonResponse

def test_api(request):
    return JsonResponse({"message": "Hello from Django!"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('test/', test_api), 
]
