from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework import status
from django.http import JsonResponse



# API endpoint to handle login requests, checking the username and password and compares db
class LoginView(APIView):
    def post(self, request):
        # Getting the username and password from request
        username = request.data.get("username")
        password = request.data.get("password")

        # User model used
        user = authenticate(username=username, password=password)

        # Authenticating that credential matches with db
        if user is not None:
            # When valid, returns a message with 200 of status
            return Response({"statMsg": "Login successful!"}, status=status.HTTP_200_OK)
        else:
            # When invalid, returns an error message of 400 HTTP status
            return Response({"statMsg": "Invalid username or password"}, status=status.HTTP_400_BAD_REQUEST)