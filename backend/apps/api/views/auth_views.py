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