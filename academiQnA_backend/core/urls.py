from django.urls import path
from .views import LoginView


# login API route
urlpatterns = [
    path('api/login/', LoginView.as_view(), name='login'),
]