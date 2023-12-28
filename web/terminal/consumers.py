import json
from channels.generic.websocket import WebsocketConsumer
from terminal.models import SessionsList

class TerminalConsumer(WebsocketConsumer):
    def connect(self):

        # WEB SERVER <--> PC A
        session = SessionsList.create_or_get()




