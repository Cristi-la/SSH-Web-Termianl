from django.urls import re_path
from terminal.consumers import TerminalConsumer

websocket_urlpatterns = [
    re_path(r'ws/socket-server/', TerminalConsumer.as_asgi())
]