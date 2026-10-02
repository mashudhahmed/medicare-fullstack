"""
Cloudinary Image & Media Upload Service for MediCare
Provides secure Cloudinary asset management with graceful local storage fallback.
"""
import os
import uuid
from typing import Optional, Dict, Any
from pathlib import Path
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.exceptions import ValidationError
from loguru import logger

ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
ALLOWED_DOCUMENT_TYPES = {
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
MAX_FILE_SIZE_BYTES = getattr(settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', 5 * 1024 * 1024)  # 5MB


def is_cloudinary_configured() -> bool:
    """Return True if valid Cloudinary credentials are set."""
    cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', None) or os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = getattr(settings, 'CLOUDINARY_API_KEY', None) or os.getenv('CLOUDINARY_API_KEY')
    api_secret = getattr(settings, 'CLOUDINARY_API_SECRET', None) or os.getenv('CLOUDINARY_API_SECRET')
    cloudinary_url = getattr(settings, 'CLOUDINARY_URL', None) or os.getenv('CLOUDINARY_URL')

    return bool(cloudinary_url or (cloud_name and api_key and api_secret))


def validate_file(file_obj, allowed_types=ALLOWED_IMAGE_TYPES, max_size=MAX_FILE_SIZE_BYTES):
    """Validate file content type and size."""
    if not file_obj:
        raise ValidationError('No file provided for upload')

    # Check size
    file_size = getattr(file_obj, 'size', None)
    if file_size and file_size > max_size:
        max_mb = max_size / (1024 * 1024)
        raise ValidationError(f'File size ({file_size / (1024 * 1024):.2f}MB) exceeds limit of {max_mb:.0f}MB')

    # Check content type if available
    content_type = getattr(file_obj, 'content_type', None)
    if content_type and content_type not in allowed_types:
        allowed_extensions = [t.split('/')[-1] for t in allowed_types]
        raise ValidationError(f'Unsupported file type: {content_type}. Allowed types: {", ".join(allowed_extensions)}')


def upload_image(
    file_obj,
    folder: str = 'avatars',
    public_id: Optional[str] = None,
    transformation: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Upload an image to Cloudinary (or local media storage as fallback).
    
    Returns:
        dict: {
            'url': str,
            'public_id': str,
            'format': str,
            'width': Optional[int],
            'height': Optional[int],
            'bytes': int,
            'provider': 'cloudinary' | 'local'
        }
    """
    validate_file(file_obj, allowed_types=ALLOWED_IMAGE_TYPES)

    cloud_folder = f"medicare/{folder.strip('/')}"

    if is_cloudinary_configured():
        try:
            import cloudinary
            import cloudinary.uploader

            default_transform = transformation or {
                'quality': 'auto',
                'fetch_format': 'auto',
            }

            options: Dict[str, Any] = {
                'folder': cloud_folder,
                'resource_type': 'image',
                'overwrite': True,
                'transformation': default_transform,
            }
            if public_id:
                options['public_id'] = public_id

            upload_result = cloudinary.uploader.upload(file_obj, **options)

            return {
                'url': upload_result.get('secure_url', upload_result.get('url')),
                'public_id': upload_result.get('public_id'),
                'format': upload_result.get('format', ''),
                'width': upload_result.get('width'),
                'height': upload_result.get('height'),
                'bytes': upload_result.get('bytes', 0),
                'provider': 'cloudinary',
            }
        except Exception as exc:
            logger.error(f"Cloudinary upload failed: {exc}. Attempting local fallback.")
            # If Cloudinary call fails with network/credential error, fallback to local storage
            return _save_locally(file_obj, folder)

    # Local fallback
    return _save_locally(file_obj, folder)


def upload_file(
    file_obj,
    folder: str = 'medical_records',
    public_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Upload a general file or medical attachment (images, PDFs, documents) to Cloudinary.
    """
    validate_file(file_obj, allowed_types=ALLOWED_DOCUMENT_TYPES)

    cloud_folder = f"medicare/{folder.strip('/')}"

    if is_cloudinary_configured():
        try:
            import cloudinary
            import cloudinary.uploader

            options: Dict[str, Any] = {
                'folder': cloud_folder,
                'resource_type': 'auto',
                'overwrite': True,
            }
            if public_id:
                options['public_id'] = public_id

            upload_result = cloudinary.uploader.upload(file_obj, **options)

            return {
                'url': upload_result.get('secure_url', upload_result.get('url')),
                'public_id': upload_result.get('public_id'),
                'format': upload_result.get('format', ''),
                'width': upload_result.get('width'),
                'height': upload_result.get('height'),
                'bytes': upload_result.get('bytes', 0),
                'provider': 'cloudinary',
            }
        except Exception as exc:
            logger.error(f"Cloudinary file upload failed: {exc}. Falling back to local storage.")
            return _save_locally(file_obj, folder)

    return _save_locally(file_obj, folder)


def delete_file(public_id: Optional[str], resource_type: str = 'image') -> bool:
    """
    Delete a file from Cloudinary (or local storage if local fallback was used).
    """
    if not public_id:
        return False

    if is_cloudinary_configured() and not public_id.startswith('local_'):
        try:
            import cloudinary.uploader
            result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            return result.get('result') in ('ok', 'not found')
        except Exception as exc:
            logger.error(f"Failed to delete Cloudinary file {public_id}: {exc}")
            return False

    # Local fallback file deletion
    if public_id.startswith('local_'):
        try:
            clean_rel_path = public_id.replace('local_', '', 1).replace('_', '/')
            if default_storage.exists(clean_rel_path):
                default_storage.delete(clean_rel_path)
                return True
        except Exception as exc:
            logger.error(f"Failed to delete local fallback file {public_id}: {exc}")
    return False


def _save_locally(file_obj, folder: str) -> Dict[str, Any]:
    """Helper to save a file to local Django media storage."""
    original_name = getattr(file_obj, 'name', 'upload')
    ext = Path(original_name).suffix.lower().lstrip('.') or 'bin'
    unique_name = f"{uuid.uuid4().hex[:12]}.{ext}"
    rel_path = os.path.join('uploads', folder, unique_name).replace('\\', '/')

    file_obj.seek(0)
    saved_path = default_storage.save(rel_path, ContentFile(file_obj.read()))
    media_url = getattr(settings, 'MEDIA_URL', '/media/')
    full_url = f"{media_url.rstrip('/')}/{saved_path.lstrip('/')}"

    return {
        'url': full_url,
        'public_id': f"local_{folder}_{unique_name}",
        'format': ext,
        'width': None,
        'height': None,
        'bytes': getattr(file_obj, 'size', 0),
        'provider': 'local',
    }
