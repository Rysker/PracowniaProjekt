import io
import base64
import secrets
import pyotp
import qrcode

from django.shortcuts import render
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status, serializers, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.backends import TokenBackend
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from drf_spectacular.utils import extend_schema
from .serializers import (
    RegisterSerializer, LoginSerializer, Verify2FASerializer, 
    ChangePasswordSerializer, RefreshTokenSerializer, Confirm2FASetupSerializer
)

from .models import UserProfile

# --- Helper functions ---
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

# --- Public Views ---
@extend_schema(responses={200: str})
@api_view(['GET'])
@permission_classes([AllowAny])
def hello(request):
    return Response({"message": "Hello from Django REST Framework!"})

@extend_schema(request=RegisterSerializer, responses={201: None})
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '').strip()
    confirm = request.data.get('re_password', '').strip()

    if '@' not in email:
        return Response({
            'error': 'Invalid email', 'invalid': ['email']}, 
            status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(password)
    except ValidationError as e:
        return Response({
            'error': ' '.join(e.messages), 'invalid': ['password']}, 
            status=status.HTTP_400_BAD_REQUEST)

    if password != confirm:
        return Response({
            'error': 'Passwords do not match', 'invalid': ['confirmPassword']}, 
            status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=email).exists():
        return Response({
            'error': 'User already exists', 'invalid': ['email']}, 
            status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create_user(username=email, email=email, password=password)
        UserProfile.objects.get_or_create(user=user)
        return Response({
            'ok': True,
            'message': 'Registration successful. Please login.'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': 'Server error', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema(request=LoginSerializer)
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '').strip()

    if not email or not password:
        return Response({
            'ok': False, 'error': 'Email and password required'}, 
            status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=email, password=password)
    
    if not user:
        return Response({
            'ok': False, 'error': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED)

    # Check if user has 2FA enabled and make appropriate decision
    if hasattr(user, 'profile') and user.profile.is_2fa_enabled:
        temp_refresh = RefreshToken.for_user(user)
        return Response({
            'ok': True,
            '2fa_required': True,
            'temp_token': str(temp_refresh.access_token),
            'message': '2FA required'
        }, status=status.HTTP_200_OK)

    # Login without 2FA Enabled
    tokens = get_tokens_for_user(user)
    return Response({
        'ok': True,
        'message': 'Logged in',
        'token': tokens['access'],
        'refresh': tokens['refresh']
    }, status=status.HTTP_200_OK)

@extend_schema(request=Verify2FASerializer)
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_2fa_login(request):
    temp_token_str = request.data.get('temp_token')
    code = str(request.data.get('code', '')).strip()

    if not temp_token_str or not code:
        return Response({'ok': False, 'error': 'Missing token or code'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        token = AccessToken(temp_token_str)
        user_id = token['user_id']
        user = User.objects.get(id=user_id)
    except Exception as e:
        return Response({'ok': False, 'error': 'Invalid session'}, status=status.HTTP_401_UNAUTHORIZED)

    if not hasattr(user, 'profile') or not user.profile.totp_secret:
        print("Brak profilu lub sekretu TOTP")
        return Response({'ok': False, 'error': '2FA not setup'}, status=status.HTTP_400_BAD_REQUEST)

    totp = pyotp.TOTP(user.profile.totp_secret)
    is_valid_totp = totp.verify(code, valid_window=1)

    is_valid_backup = False
    if not is_valid_totp:
        backup_codes_hashes = user.profile.backup_codes or []
        for hashed_code in backup_codes_hashes:
            if check_password(code, hashed_code):
                is_valid_backup = True
                user.profile.backup_codes.remove(hashed_code)
                user.profile.save()
                break

    if is_valid_totp or is_valid_backup:
        tokens = get_tokens_for_user(user)
        return Response({
            'ok': True,
            'message': 'Logged in',
            'token': tokens['access'],
            'refresh': tokens['refresh']
        }, status=status.HTTP_200_OK)
    
    return Response({
        'ok': False, 'error': 'Invalid authentication code'}, 
        status=status.HTTP_400_BAD_REQUEST)

@extend_schema(request=RefreshTokenSerializer)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({
                'error': 'Refresh token is required'}, 
                status=status.HTTP_400_BAD_REQUEST)
            
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({
            'ok': True, 'message': 'Logged out successfully'}, 
            status=status.HTTP_205_RESET_CONTENT)
    except Exception as e:
        return Response({
            'error': 'Invalid token', 'details': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST)


# --- 2FA Management ---
@extend_schema(
    description="Generuje sekret i kod QR (tylko jeśli 2FA nieaktywne)",
    responses={200: None}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def setup_2fa(request):
    user = request.user
    UserProfile.objects.get_or_create(user=user)

    if user.profile.is_2fa_enabled:
        return Response({
            'is_enabled': True,
            'secret': None,
            'qr_code': None,
            'backup_codes': []
        })

    user.profile.totp_secret = pyotp.random_base32()
    
    raw_backup_codes = [secrets.token_hex(4) for _ in range(10)]
    hashed_backup_codes = [make_password(code) for code in raw_backup_codes]
    
    user.profile.backup_codes = hashed_backup_codes
    user.profile.save()

    totp_uri = pyotp.totp.TOTP(user.profile.totp_secret).provisioning_uri(
        name=user.email,
        issuer_name="PracowniaProjekt"
    )
    
    qr = qrcode.make(totp_uri)
    stream = io.BytesIO()
    qr.save(stream, format="PNG")
    qr_base64 = base64.b64encode(stream.getvalue()).decode()

    return Response({
        'secret': user.profile.totp_secret,
        'qr_code': f"data:image/png;base64,{qr_base64}",
        'backup_codes': raw_backup_codes,
        'is_enabled': False
    })

@extend_schema(request=Confirm2FASetupSerializer)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_2fa_setup(request):
    user = request.user
    code = request.data.get('code')
    enable = request.data.get('enable', True)

    if not enable:
        user.profile.is_2fa_enabled = False
        user.profile.save()
        return Response({'ok': True, 'message': '2FA disabled successfully'})

    if not hasattr(user, 'profile') or not user.profile.totp_secret:
        return Response({
            'error': 'Setup not initialized'}, 
            status=status.HTTP_400_BAD_REQUEST)

    totp = pyotp.TOTP(user.profile.totp_secret)
    if totp.verify(code):
        user.profile.is_2fa_enabled = True
        user.profile.save()
        return Response({'ok': True, 'message': '2FA enabled successfully'})
    
    return Response({
        'ok': False, 'error': 'Invalid code'}, 
        status=status.HTTP_400_BAD_REQUEST)

# --- Account Management ---
@extend_schema(request=ChangePasswordSerializer)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    current = request.data.get('current_password', '').strip()
    new = request.data.get('new_password', '').strip()
    new2 = request.data.get('new_password2', '').strip()

    if not current:
        return Response({
            'ok': False, 'error': 'Current password required'}, 
            status=status.HTTP_400_BAD_REQUEST)
    
    if new != new2:
        return Response({
            'ok': False, 'error': 'New passwords do not match'}, 
            status=status.HTTP_400_BAD_REQUEST)
    
    if not user.check_password(current):
        return Response({
            'ok': False, 'error': 'Invalid current password'}, 
            status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(new, user=user)
    except ValidationError as exc:
        return Response({
            'ok': False, 'error': ' '.join(exc.messages)}, 
            status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new)
    user.save()
    return Response({'ok': True, 'message': 'Password changed successfully'})


# --- Debug Functions. MUST BE DISABLED OR PERMISSION CHANGED BEFORE MOVING APP TO PRODUCTION ---
@api_view(['GET'])
@permission_classes([AllowAny])
def debug_users(request):
    users = User.objects.all()
    data = []
    for u in users:
        has_profile = hasattr(u, 'profile')
        data.append({
            "email": u.email,
            "has_profile": has_profile,
            "2fa_enabled": u.profile.is_2fa_enabled if has_profile else False,
            "backup_codes_count": len(u.profile.backup_codes) if has_profile and u.profile.backup_codes else 0
        })
    return Response({"users": data})

@api_view(['DELETE'])
@permission_classes([AllowAny])
def debug_delete_users(request):
    count = User.objects.count()
    User.objects.all().delete()
    return Response({'ok': True, 'message': f'{count} users deleted.'})