import io
from PIL import Image
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from apps.models.user import User
from apps.services import cloudinary_service


def generate_test_image(filename="test.png", format="PNG", size=(100, 100), color=(0, 128, 255)):
    """Generate an in-memory dummy image for test uploads."""
    file_io = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(file_io, format=format)
    file_io.seek(0)
    return SimpleUploadedFile(
        name=filename,
        content=file_io.read(),
        content_type=f"image/{format.lower()}",
    )


class UploadFeatureTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@medicare.local',
            password='TestPassword123!',
            full_name='Test Patient',
            role='patient',
            status='approved',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_unauthenticated_upload_rejected(self):
        unauth_client = APIClient()
        test_img = generate_test_image()
        response = unauth_client.post('/api/v1/auth/avatar/', {'avatar': test_img}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_avatar_upload_success(self):
        test_img = generate_test_image('avatar.png')
        response = self.client.post('/api/v1/auth/avatar/', {'avatar': test_img}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('avatar_url', response.data)
        self.assertIn('user', response.data)
        self.assertTrue(bool(response.data['user']['profile_picture']))

        # Reload user from DB
        self.user.refresh_from_db()
        self.assertTrue(bool(self.user.profile_picture))
        self.assertTrue(bool(self.user.profile_picture_public_id))

    def test_avatar_delete_success(self):
        # First assign avatar
        self.user.profile_picture = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
        self.user.profile_picture_public_id = 'medicare/avatars/user_test'
        self.user.save()

        response = self.client.delete('/api/v1/auth/avatar/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['user']['profile_picture'])
        self.user.refresh_from_db()
        self.assertFalse(bool(self.user.profile_picture))
        self.assertFalse(bool(self.user.profile_picture_public_id))

    def test_media_upload_success(self):
        test_img = generate_test_image('record.png')
        response = self.client.post(
            '/api/v1/upload/image/',
            {'file': test_img, 'folder': 'records'},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('url', response.data)
        self.assertIn('public_id', response.data)
        self.assertEqual(response.data['format'], 'png')

    def test_media_delete_success(self):
        test_img = generate_test_image('temp.png')
        upload_resp = self.client.post(
            '/api/v1/upload/image/',
            {'file': test_img, 'folder': 'temp'},
            format='multipart',
        )
        self.assertEqual(upload_resp.status_code, status.HTTP_201_CREATED)
        pub_id = upload_resp.data['public_id']

        del_resp = self.client.post('/api/v1/upload/delete/', {'public_id': pub_id})
        self.assertEqual(del_resp.status_code, status.HTTP_200_OK)

    def test_invalid_file_type_rejected(self):
        fake_executable = SimpleUploadedFile(
            name='script.exe',
            content=b'echo hello',
            content_type='application/x-msdownload',
        )
        response = self.client.post('/api/v1/auth/avatar/', {'avatar': fake_executable}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
