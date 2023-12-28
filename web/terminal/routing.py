from django.urls import re_path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from terminal.consumers import TerminalConsumer, SshConsumer

websocket_urlpatterns = [
    re_path(r'ws/socket-server/', TerminalConsumer.as_asgi()),
    re_path(r'ws/ssh-socket/$', SshConsumer.as_asgi())
]

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})