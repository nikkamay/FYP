from django.urls import path
from django.http import JsonResponse  # Import JsonResponse
from .views import LoginView

# Default response for the core app root path
def core_root_view(request):
    return JsonResponse({"message": "Core app root!"})

# Define core app-specific URL patterns
urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),  # Login endpoint
    path('', core_root_view),  # Root path for the core app
]