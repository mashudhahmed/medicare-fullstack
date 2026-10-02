"""
Upload Views for MediCare
Handles avatar uploads and general media/document uploads to Cloudinary.
"""
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError

from apps.services import cloudinary_service
from apps.schemas.user_schema import UserSerializer


class AvatarUploadView(APIView):
    """
    Upload or remove current user's avatar image.
    Supports Cloudinary storage with fallback to local media storage.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('avatar') or request.FILES.get('image') or request.FILES.get('file')
        if not file_obj:
            return Response(
                {'error': 'No image file provided. Please provide a file in the "avatar" field.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        # If user already has an avatar in Cloudinary, delete it first
        if user.profile_picture_public_id:
            try:
                cloudinary_service.delete_file(user.profile_picture_public_id, resource_type='image')
            except Exception:
                pass

        try:
            result = cloudinary_service.upload_image(
                file_obj,
                folder='avatars',
                public_id=f"user_{user.id.hex[:12]}",
            )
        except ValidationError as e:
            return Response({'error': str(e.detail if hasattr(e, 'detail') else e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Failed to upload image: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        user.profile_picture = result['url']
        user.profile_picture_public_id = result['public_id']
        user.save(update_fields=['profile_picture', 'profile_picture_public_id', 'updated_at'])

        return Response({
            'message': 'Avatar updated successfully',
            'avatar_url': result['url'],
            'public_id': result['public_id'],
            'provider': result['provider'],
            'user': UserSerializer(user, context={'request': request}).data,
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        user = request.user

        if user.profile_picture_public_id:
            cloudinary_service.delete_file(user.profile_picture_public_id, resource_type='image')

        user.profile_picture = None
        user.profile_picture_public_id = None
        user.save(update_fields=['profile_picture', 'profile_picture_public_id', 'updated_at'])

        return Response({
            'message': 'Avatar removed successfully',
            'user': UserSerializer(user, context={'request': request}).data,
        }, status=status.HTTP_200_OK)


class MediaUploadView(APIView):
    """
    Upload general media files (images, PDFs, documents for medical records/prescriptions).
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('file') or request.FILES.get('image')
        if not file_obj:
            return Response(
                {'error': 'No file provided. Please provide a file in the "file" field.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        folder = request.data.get('folder', 'general')
        # Sanitize folder name
        folder = ''.join(c for c in folder if c.isalnum() or c in ('_', '-')) or 'general'

        content_type = getattr(file_obj, 'content_type', '')
        is_image = content_type.startswith('image/')

        try:
            if is_image:
                result = cloudinary_service.upload_image(file_obj, folder=folder)
            else:
                result = cloudinary_service.upload_file(file_obj, folder=folder)
        except ValidationError as e:
            return Response({'error': str(e.detail if hasattr(e, 'detail') else e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Upload failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'message': 'File uploaded successfully',
            'url': result['url'],
            'public_id': result['public_id'],
            'format': result['format'],
            'bytes': result['bytes'],
            'provider': result['provider'],
        }, status=status.HTTP_201_CREATED)


class MediaDeleteView(APIView):
    """
    Delete a media asset by its public_id.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        public_id = request.data.get('public_id')
        resource_type = request.data.get('resource_type', 'image')

        if not public_id:
            return Response({'error': 'public_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        success = cloudinary_service.delete_file(public_id, resource_type=resource_type)
        return Response({
            'message': 'File deleted successfully' if success else 'File could not be deleted or was already removed',
            'success': success,
        }, status=status.HTTP_200_OK)
