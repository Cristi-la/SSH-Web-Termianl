import json
from channels.generic.websocket import WebsocketConsumer
from channels.consumer import AsyncConsumer

class TerminalConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.send(text_data=json.dumps(
                {
                    'giga': 'kox',
                    'moja': 'mama',
                }
            )
        )
        #  When user connects
        # return super().connect()
    
    # async def receive(self, text_data=None, bytes_data=None):
    #     # When user send data
    #     return super().receive(text_data, bytes_data)
    
    # async def disconnect(self, code):
    #     # When user disconect
    #     return super().disconnect(code)