from rest_framework import serializers

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    re_password = serializers.CharField(write_only=True)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class Verify2FASerializer(serializers.Serializer):
    temp_token = serializers.CharField()
    code = serializers.CharField(max_length=6, min_length=6)

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password2 = serializers.CharField(write_only=True)

class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField()

class Confirm2FASetupSerializer(serializers.Serializer):
    code = serializers.CharField()
    enable = serializers.BooleanField(default=True)