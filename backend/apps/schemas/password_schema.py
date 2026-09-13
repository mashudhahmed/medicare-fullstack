from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.utils import timezone
from apps.models.user import User


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value, is_deleted=False).exists():
            raise serializers.ValidationError("No account found with this email.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    code = serializers.CharField(required=False, max_length=10)
    uid = serializers.CharField(required=False)
    token = serializers.CharField(required=False)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password2": "Passwords do not match"})

        user = None
        code_obj = None

        # Mode 1: 6-digit verification code
        if attrs.get('code') and attrs.get('email'):
            email = attrs['email'].strip().lower()
            code_str = attrs['code'].strip()
            try:
                user = User.objects.get(email=email, is_deleted=False)
            except User.DoesNotExist:
                raise serializers.ValidationError({"email": "No account found with this email."})

            from apps.models.password_reset import PasswordResetCode
            code_obj = PasswordResetCode.objects.filter(
                user=user,
                code=code_str,
                is_used=False,
                expires_at__gte=timezone.now()
            ).first()

            if not code_obj:
                raise serializers.ValidationError({"code": "Invalid or expired verification code."})

        # Mode 2: Legacy link with uid & token
        elif attrs.get('uid') and attrs.get('token'):
            try:
                uid = force_str(urlsafe_base64_decode(attrs['uid']))
                user = User.objects.get(pk=uid, is_deleted=False)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                raise serializers.ValidationError({"uid": "Invalid reset link"})

            if not default_token_generator.check_token(user, attrs['token']):
                raise serializers.ValidationError({"token": "Invalid or expired token"})
        else:
            raise serializers.ValidationError("Please provide your email and the 6-digit verification code.")

        attrs['user'] = user
        attrs['code_obj'] = code_obj
        return attrs