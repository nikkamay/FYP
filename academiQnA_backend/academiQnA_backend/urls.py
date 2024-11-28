"""
URL configuration for academiQnA_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
# URL routing imports
from django.urls import path, include 
from django.http import JsonResponse  # Import for default root view

# Default response for root path
def root_view(request):
    return JsonResponse({"message": "Welcome to the AcademiQ&A backend!"})

urlpatterns = [
    path('admin/', admin.site.urls),  # Admin route
    path('api/', include('core.urls')),  # Include core app URLs under /api/
    path('', root_view),  # Root path for the entire project
]
