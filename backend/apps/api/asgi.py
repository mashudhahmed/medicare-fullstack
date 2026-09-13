import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare_project.settings.development')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from apps.core.jwt_auth_middleware import JWTAuthMiddlewareStack
import apps.api.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            apps.api.routing.websocket_urlpatterns
        )
    ),
})