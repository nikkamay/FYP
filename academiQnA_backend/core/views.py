from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework import status
from django.http import JsonResponse


# Inital testing database before PostgreSQL
test_db = {
    "test": "test",
    "user": "password"
}

# API endpoint to handle login requests, checking the username and password and compares with test_db
class LoginView(APIView):
    def post(self, request):
        # Getting the username and password from request
        username = request.data.get("username")
        password = request.data.get("password")

        # Authenticating that credential matches with test_db
        if username in test_db and test_db[username] == password:
            # When valid, returns a message with 200 of status
            return Response({"statMsg": "Login successful!"}, status=status.HTTP_200_OK)
        else:
            # When invalid, returns an error message of 400 HTTP status
            return Response({"statMsg": "Invalid username or password"}, status=status.HTTP_400_BAD_REQUEST)