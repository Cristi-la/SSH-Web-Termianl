import asyncio
import json
from channels.generic.websocket import WebsocketConsumer, AsyncWebsocketConsumer
from channels.consumer import AsyncConsumer
from .ssh import SSHModule

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


class SshConsumer(AsyncWebsocketConsumer):
    sessions = {}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.ssh_module = None
        # TODO: group_name ready for future implementation.
        # TODO: Last time we talked you mentioned that each session will have unique identifier. It can be used here.
        self.group_name = '1'
        self.read_ssh_task = None

    @classmethod
    async def get_or_create_session(cls, group_name, host, username, password, port=None):
        return await SSHModule.get_or_create_instance(group_name, host, username, password, port)

    async def connect(self):
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # TODO: To be changed when we determine frontend solution
        self.ssh_module = await self.get_or_create_session(self.group_name, 'host', 'username', 'password')

        self.start_read_ssh_task()

    async def disconnect(self, close_code):
        await self.ssh_module.disconnect()

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)

        data = text_data_json.get('data')
        if data:
            await self.ssh_module.input_data(data)
            self.start_read_ssh_task()

    async def ssh_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({'message': message}))

    # TODO: If not used later on then to be deleted, for now not sure so I left it commented.
    # async def send_group_message(self, message):
    #     await self.channel_layer.group_send(
    #         self.group_name,
    #         {
    #             'type': 'group_message',
    #             'message': message,
    #             'sender_channel_name': self.channel_name
    #         }
    #     )
    #
    # async def group_message(self, event):
    #     if event['sender_channel_name'] != self.channel_name:
    #         await self.send(text_data=json.dumps({
    #             'message': event['message']
    #         }))

    async def send_group_message_inclusive(self, message):
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'group_message_inclusive',
                'message': message
            }
        )

    async def group_message_inclusive(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))

    def start_read_ssh_task(self):
        if self.read_ssh_task is None or self.read_ssh_task.done():
            self.read_ssh_task = asyncio.create_task(self.read_ssh())

    async def read_ssh(self):
        no_data_duration = 0

        while True:
            if no_data_duration >= 5:
                break

            data = await self.ssh_module.read_data()
            if data is not None:
                no_data_duration = 0
                await self.send_group_message_inclusive(data)
            else:
                no_data_duration += 0.1

            await asyncio.sleep(0.1)
