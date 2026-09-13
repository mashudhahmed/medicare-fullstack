from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from django.db import close_old_connections
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import jwt
from django.conf import settings

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_string):
    try:
        UntypedToken(token_string)
        decoded_data = jwt.decode(
            token_string,
            settings.SIMPLE_JWT.get('SIGNING_KEY', settings.SECRET_KEY),
            algorithms=[settings.SIMPLE_JWT.get('ALGORITHM', 'HS256')]
        )
        user_id = decoded_data.get(settings.SIMPLE_JWT.get('USER_ID_CLAIM', 'user_id'))
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError, jwt.PyJWTError, User.DoesNotExist, KeyError):
        return AnonymousUser()

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        close_old_connections()
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            if "user" not in scope or not scope["user"].is_authenticated:
                scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)