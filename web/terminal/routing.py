from django.urls import re_path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from terminal.consumers import SshConsumer, SessionCosumer

websocket_urlpatterns = [
    re_path(r'ws/ssh/(?P<group_name>\w+)$', SshConsumer.as_asgi()),

    # TODO: MOVE FUNCTIONALITY Above consumers functionality to below consumer
    re_path(r'ws/session/(?P<session_id>\w+)$', SessionCosumer.as_asgi()),
]

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})