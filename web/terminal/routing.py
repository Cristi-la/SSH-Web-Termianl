from django.urls import re_path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from terminal.consumers import SessionCosumer

websocket_urlpatterns = [
    re_path(r'ws/session/(?P<session_id>\w+)$', SessionCosumer.as_asgi()),
]

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})