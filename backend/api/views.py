from django.shortcuts import render

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
import json
from django.conf import settings
from django.contrib.auth.password_validation import validate_password, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

import traceback

def hello(request):
    return JsonResponse({"message": "Hello from Django!"})

@csrf_exempt
def register(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    email = payload.get('email', '').strip()
    password = payload.get('password', '').strip()
    confirm = payload.get('re_password', '').strip()

    if '@' not in email:
        return JsonResponse({'error': 'Invalid email', 'invalid': ['email']}, status=400)
    
    try:
        validate_password(password)
    except ValidationError as e:
        return JsonResponse({
            'error': ' '.join(e.messages),
            'invalid': ['password']
        }, status=400)
    
    if password != confirm:
        return JsonResponse({'error': 'Passwords do not match', 'invalid': ['confirmPassword']}, status=400)

    if User.objects.filter(username=email).exists():
        return JsonResponse({'error': 'User already exists', 'invalid': ['email']}, status=400)

    user = User.objects.create_user(username=email, email=email, password=password)
    user.save()
    refresh = RefreshToken.for_user(user)
    return JsonResponse({'ok': True, 'message': 'Registered (demo)', 'token': str(refresh.access_token), 'refresh': str(refresh)})


@csrf_exempt
def login_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    email = payload.get('email', '').strip()
    password = payload.get('password', '').strip()

    if not email or '@' not in email:
        return JsonResponse({'ok': False, 'error': 'Invalid email', 'invalid': ['email']}, status=400)
    if not password:
        return JsonResponse({'ok': False, 'error': 'Missing password', 'invalid': ['password']}, status=400)

    try:
        user = authenticate(request, username=email, password=password)
        if not user:
            return JsonResponse({'ok': False, 'error': 'Invalid credentials', 'invalid': ['email', 'password']}, status=401)

        refresh = RefreshToken.for_user(user)
        return JsonResponse({
            'ok': True,
            'message': 'Logged in (demo)',
            'token': str(refresh.access_token),
            'refresh': str(refresh)
        })
    
    except Exception as e:
        return JsonResponse({
            'ok': False,
            'error': 'Server error',
            'details': str(e),
            'trace': traceback.format_exc()
        }, status=500)

@csrf_exempt
def debug_users(request):
    users = User.objects.all()
    data = [
        {
            "email": u.email,
            "password_hash": u.password,
        }
        for u in users
    ]
    return JsonResponse({"users": data})

@csrf_exempt
def debug_delete_users(request):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'DELETE required'}, status=405)
    
    count = User.objects.count()
    User.objects.all().delete()
    
    return JsonResponse({'ok': True, 'message': f'{count} users deleted.'})

@csrf_exempt
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token is None:
            return Response({'error': 'Refresh token required'}, status=400)
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'ok': True, 'message': 'Logged out'})
    
    except Exception as e:
        return Response({'error': str(e)}, status=400)