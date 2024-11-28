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
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include 
from django.http import JsonResponse

# Default response for root path
def root_view(request):
    return JsonResponse({"message": "Welcome to the AcademiQ&A backend!"})

# URL routing 
urlpatterns = [
    path('admin/', admin.site.urls),  # Admin route
    path('api/', include('core.urls')),  # Core API routes
    path('', root_view),  # Root path for the entire project
]

# When debug = true, enables uploaded files accessible in development
if settings.DEBUG:
    # Allows access to files uploaded when debug is active
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)