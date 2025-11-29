from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
import json
import traceback
import pyotp
import qrcode
import io
import base64
import secrets
from django.conf import settings
from django.contrib.auth.password_validation import validate_password, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.backends import TokenBackend
from .models import UserProfile

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

        if hasattr(user, 'profile') and user.profile.is_2fa_enabled:
            temp_token = RefreshToken.for_user(user)
            return JsonResponse({
                'ok': True,
                '2fa_required': True,
                'temp_token': str(temp_token.access_token),
                'message': '2FA required'
            })

        refresh = RefreshToken.for_user(user)
        return JsonResponse({
            'ok': True,
            'message': 'Logged in',
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
def verify_2fa_login(request):
    if request.method != 'POST': return JsonResponse({}, status=405)

    try:
        data = json.loads(request.body)
        temp_token_str = data.get('temp_token')
        code = data.get('code', '').strip()

        try:
            valid_data = TokenBackend(algorithm='HS256').decode(temp_token_str, verify=False)
            user = User.objects.get(id=valid_data['user_id'])
        except Exception:
             return JsonResponse({'ok': False, 'error': 'Invalid or expired session'}, status=401)

        if not user.profile.totp_secret:
             return JsonResponse({'ok': False, 'error': '2FA not setup for this user'}, status=400)

        # 1. Sprawdź czy to kod TOTP
        totp = pyotp.TOTP(user.profile.totp_secret)
        is_valid_totp = totp.verify(code)

        # 2. Sprawdź czy to kod zapasowy
        is_valid_backup = False
        if not is_valid_totp:
            backup_codes = user.profile.backup_codes or []
            if code in backup_codes:
                is_valid_backup = True
                # Usuń zużyty kod
                user.profile.backup_codes.remove(code)
                user.profile.save()

        if is_valid_totp or is_valid_backup:
            refresh = RefreshToken.for_user(user)
            return JsonResponse({
                'ok': True,
                'message': 'Logged in via 2FA' + (' (Backup Code)' if is_valid_backup else ''),
                'token': str(refresh.access_token),
                'refresh': str(refresh)
            })
        else:
            return JsonResponse({'ok': False, 'error': 'Invalid authentication code'}, status=400)

    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)}, status=500)

@csrf_exempt
def setup_2fa(request):
    """
    Generuje sekret, kod QR oraz kody zapasowe.
    """
    user = request.user
    if not user.is_authenticated:
        # Fallback manual auth check
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            try:
                token_str = auth_header.split(' ')[1]
                valid_data = TokenBackend(algorithm='HS256').decode(token_str, verify=False)
                user = User.objects.get(id=valid_data['user_id'])
            except:
                return JsonResponse({'error': 'Unauthorized'}, status=401)
        else:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

    if not hasattr(user, 'profile'):
        UserProfile.objects.create(user=user)

    # Zawsze generuj nowy sekret przy wejściu w setup, jeśli 2FA nie jest aktywne
    # (lub jeśli user chce zresetować - w tej wersji zakładamy start od zera przy setupie)
    if not user.profile.is_2fa_enabled:
        user.profile.totp_secret = pyotp.random_base32()
        # Generuj 10 kodów zapasowych (8 cyfr hex)
        new_backup_codes = [secrets.token_hex(4) for _ in range(10)]
        user.profile.backup_codes = new_backup_codes
        user.profile.save()

    totp_uri = pyotp.totp.TOTP(user.profile.totp_secret).provisioning_uri(
        name=user.email,
        issuer_name="PracowniaProjekt"
    )

    qr = qrcode.make(totp_uri)
    stream = io.BytesIO()
    qr.save(stream, format="PNG")
    qr_base64 = base64.b64encode(stream.getvalue()).decode()

    return JsonResponse({
        'secret': user.profile.totp_secret,
        'qr_code': f"data:image/png;base64,{qr_base64}",
        'backup_codes': user.profile.backup_codes,
        'is_enabled': user.profile.is_2fa_enabled
    })

@csrf_exempt
def confirm_2fa_setup(request):
    """
    Włącza lub wyłącza 2FA.
    Przy włączaniu wymaga kodu TOTP.
    Przy wyłączaniu NIE wymaga kodu (zgodnie z prośbą).
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    user = request.user
    if not user.is_authenticated:
        # Fallback auth
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            try:
                token_str = auth_header.split(' ')[1]
                valid_data = TokenBackend(algorithm='HS256').decode(token_str, verify=False)
                user = User.objects.get(id=valid_data['user_id'])
            except:
                return JsonResponse({'error': 'Unauthorized'}, status=401)
        else:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

    try:
        data = json.loads(request.body)
        code = data.get('code')
        enable = data.get('enable', True)

        # Scenariusz WYŁĄCZANIA - bez kodu
        if not enable:
            user.profile.is_2fa_enabled = False
            user.profile.save()
            return JsonResponse({'ok': True, 'message': '2FA disabled successfully'})

        # Scenariusz WŁĄCZANIA - wymaga kodu
        if not user.profile.totp_secret:
             return JsonResponse({'error': 'Setup not initialized'}, status=400)

        totp = pyotp.TOTP(user.profile.totp_secret)
        if totp.verify(code):
            user.profile.is_2fa_enabled = True
            user.profile.save()
            return JsonResponse({'ok': True, 'message': '2FA enabled successfully'})
        else:
            return JsonResponse({'ok': False, 'error': 'Invalid code'}, status=400)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def debug_users(request):
    users = User.objects.all()
    data = []
    for u in users:
        has_profile = hasattr(u, 'profile')
        data.append({
            "email": u.email,
            "password_hash": u.password,
            "has_profile": has_profile,
            "2fa_enabled": u.profile.is_2fa_enabled if has_profile else False,
            "has_backup_codes": len(u.profile.backup_codes) if has_profile else 0
        })
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
    return JsonResponse({'ok': True, 'message': 'Logged out'})