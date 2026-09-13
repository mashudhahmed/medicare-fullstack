import os
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, logout
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from apps.models.user import User
from apps.schemas.user_schema import UserSerializer, RegisterSerializer, LoginSerializer, ChangePasswordSerializer
from apps.schemas.password_schema import PasswordResetRequestSerializer, PasswordResetConfirmSerializer


@method_decorator(ratelimit(key='ip', rate='3/m', method='POST', block=True), name='create')
class RegisterView(generics.CreateAPIView):
    """User registration endpoint with rate limiting (3 per minute per IP)"""
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)


@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='post')
class LoginView(generics.GenericAPIView):
    """User login endpoint with rate limiting (5 per minute per IP)"""
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        if user.two_factor_enabled and user.totp_secret:
            from django.core.signing import TimestampSigner
            signer = TimestampSigner()
            temp_token = signer.sign(str(user.id))
            return Response({
                'requires_2fa': True,
                'temp_token': temp_token,
                'email': user.email,
                'message': 'Two-factor authentication code required'
            }, status=status.HTTP_200_OK)

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            logout(request)
            return Response({
                'message': 'Logged out successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    """Change user password"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


class RefreshTokenView(APIView):
    """Refresh access token"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({
                'error': 'Refresh token required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_401_UNAUTHORIZED)


class UserStatusView(APIView):
    """Check if user is authenticated"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'is_authenticated': True,
            'user': UserSerializer(request.user).data
        }, status=status.HTTP_200_OK)


class PasswordResetRequestView(generics.GenericAPIView):
    """Request password reset with 6-digit email code and link"""
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.get(email=serializer.validated_data['email'])

        from apps.models.password_reset import PasswordResetCode
        reset_code = PasswordResetCode.create_for_user(user, expiry_minutes=15)

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        origin = request.headers.get('Origin') or request.META.get('HTTP_ORIGIN')
        frontend_url = origin or os.getenv('FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url.rstrip('/')}/reset-password?email={user.email}&code={reset_code.code}&uid={uid}&token={token}"

        email_message = (
            f"Hello {user.get_full_name()},\n\n"
            f"Your MediCare Hub password reset verification code is:\n\n"
            f"    {reset_code.code}\n\n"
            f"This code will expire in 15 minutes.\n\n"
            f"Alternatively, you can click the link below to reset your password directly:\n"
            f"{reset_link}\n\n"
            f"If you didn't request this, please ignore this email."
        )

        send_mail(
            subject="Password Reset Code - MediCare Hub",
            message=email_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        from apps.utils.audit import log_audit
        log_audit(
            request=request,
            action='SECURITY',
            resource_type='User',
            resource_id=str(user.id),
            details={'action': 'password_reset_code_requested', 'email': user.email}
        )

        response_data = {
            "message": "Verification code sent to your email.",
            "email": user.email,
        }
        if settings.DEBUG:
            response_data["code"] = reset_code.code
            response_data["reset_link"] = reset_link

        return Response(response_data)


class PasswordResetConfirmView(generics.GenericAPIView):
    """Confirm password reset with 6-digit code or link token"""
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        code_obj = serializer.validated_data.get('code_obj')
        if code_obj:
            code_obj.is_used = True
            code_obj.save(update_fields=['is_used'])

        from apps.utils.audit import log_audit
        log_audit(
            request=request,
            action='UPDATE',
            resource_type='User',
            resource_id=str(user.id),
            details={'action': 'password_reset_confirmed', 'method': 'code' if code_obj else 'token'}
        )

        return Response({"message": "Password has been reset successfully."})


@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='post')
class TwoFactorVerifyView(APIView):
    """Verify 6-digit TOTP code during login challenge"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        temp_token = request.data.get('temp_token')
        code = str(request.data.get('code', '')).strip()

        if not temp_token or not code:
            return Response(
                {'error': 'Temporary 2FA token and 6-digit code are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
        signer = TimestampSigner()
        try:
            user_id = signer.unsign(temp_token, max_age=300)  # 5 minutes valid
        except (BadSignature, SignatureExpired):
            return Response(
                {'error': '2FA verification session has expired or is invalid. Please log in again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id, is_deleted=False)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.totp_secret or not user.two_factor_enabled:
            return Response(
                {'error': 'Two-factor authentication is not active on this account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        import pyotp
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(code, valid_window=1):
            return Response(
                {'error': 'Invalid 2FA verification code. Please check your authenticator app.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        refresh = RefreshToken.for_user(user)

        from apps.utils.audit import log_audit
        log_audit(
            request=request,
            action='LOGIN',
            resource_type='User',
            resource_id=str(user.id),
            details={'method': 'totp_2fa'}
        )

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Two-factor verification successful.'
        }, status=status.HTTP_200_OK)


class TwoFactorSetupView(APIView):
    """Generate TOTP secret and QR code for authenticator setup"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        import pyotp
        import qrcode
        import io
        import base64

        user = request.user
        secret = pyotp.random_base32()
        uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name="MediCare Hub"
        )

        qr = qrcode.QRCode(box_size=6, border=2)
        qr.add_data(uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_b64 = base64.b64encode(buf.getvalue()).decode()
        qr_data_uri = f"data:image/png;base64,{qr_b64}"

        return Response({
            'secret': secret,
            'qr_code': qr_data_uri,
            'email': user.email,
            'provisioning_uri': uri,
            'is_enabled': user.two_factor_enabled,
        })


class TwoFactorEnableView(APIView):
    """Validate 6-digit code to finalize 2FA activation"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        secret = request.data.get('secret')
        code = str(request.data.get('code', '')).strip()

        if not secret or not code:
            return Response(
                {'error': 'Secret key and verification code are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        import pyotp
        totp = pyotp.TOTP(secret)
        if not totp.verify(code, valid_window=1):
            return Response(
                {'error': 'Invalid verification code. Please ensure your device clock is synchronized and try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        user.totp_secret = secret
        user.two_factor_enabled = True
        user.save(update_fields=['totp_secret', 'two_factor_enabled'])

        from apps.utils.audit import log_audit
        log_audit(
            request=request,
            action='UPDATE',
            resource_type='User',
            resource_id=str(user.id),
            details={'action': '2fa_enabled'}
        )

        return Response({
            'message': 'Two-factor authentication has been enabled successfully.',
            'two_factor_enabled': True,
        }, status=status.HTTP_200_OK)


class TwoFactorDisableView(APIView):
    """Disable 2FA after code verification"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = str(request.data.get('code', '')).strip()
        user = request.user

        if not user.two_factor_enabled or not user.totp_secret:
            return Response(
                {'error': 'Two-factor authentication is not currently enabled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        import pyotp
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(code, valid_window=1):
            return Response(
                {'error': 'Invalid verification code. Please enter the current 6-digit code from your authenticator.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.two_factor_enabled = False
        user.totp_secret = None
        user.save(update_fields=['two_factor_enabled', 'totp_secret'])

        from apps.utils.audit import log_audit
        log_audit(
            request=request,
            action='UPDATE',
            resource_type='User',
            resource_id=str(user.id),
            details={'action': '2fa_disabled'}
        )

        return Response({
            'message': 'Two-factor authentication has been disabled.',
            'two_factor_enabled': False,
        }, status=status.HTTP_200_OK)