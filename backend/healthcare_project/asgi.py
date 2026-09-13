"""
ASGI config for healthcare_project.
Supports HTTP + WebSockets via Django Channels.
"""
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault(
    'DJANGO_SETTINGS_MODULE',
    'healthcare_project.settings'
)

django_asgi_app = get_asgi_application()

# WebSocket URL patterns – add when you implement real-time features
# from apps.api.routing import websocket_urlpatterns
websocket_urlpatterns = []

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
