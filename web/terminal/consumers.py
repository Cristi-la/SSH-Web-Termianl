import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.consumer import AsyncConsumer
from terminal.ssh import SSHModule
from terminal.models import SessionsList, BaseData
from channels.db import database_sync_to_async

class SessionCosumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def get_session(self, session_id):
        print(session_id)
        return {}
        # obj = SessionsList.objects.select_related('user').get(pk=session_id)
        # print(obj.content_object)
        # return SessionsList.objects.get(pk=session_id)

    async def connect(self, *args, **kwargs):
        self.session_id = self.scope['url_route']['kwargs']['session_id']+'test'
        await self.channel_layer.group_add(self.session_id, self.channel_name)
        await self.accept()
        await self.send_group_message_inclusive('test')
        # session_id = self.scope['url_route']['kwargs']['session_id']

        # if not session_id:
        #     await self.close()

        # try:
        #     # obj = await self.
        #     (session_id)
        #     # if obj.user.pk == self.scope['user'].pk:
        #     await self.channel_layer.group_add('test'+str(111), self.channel_name)
        #     await self.accept()

        # except SessionsList.DoesNotExist:
        #     pass
        # except Exception as e:
        #     print(e)
        #     await self.close()

    async def send_group_message_inclusive(self, message):
        await self.channel_layer.group_send(
            self.session_id,
            {
                'type': 'group_message_inclusive',
                'message': message
            }
        )

    async def group_message_inclusive(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))


class SshConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.group_name = None
        self.read_task = None

    async def connect(self):
        self.group_name = self.scope['url_route']['kwargs']['group_name']
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # TODO: To be changed when we determine frontend solution
        # await SSHModule.connect_or_create_instance(self.group_name, 'host', 'username', 'password')

        self.start_read()

    async def disconnect(self, close_code):
        await SSHModule.disconnect(self.group_name)

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)

        data = text_data_json.get('data')
        if data:
            await SSHModule.send(self.group_name, data)
            self.start_read()

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

    def start_read(self):
        if self.read_task is None or self.read_task.done():
            self.read_task = asyncio.create_task(self.read())

    async def read(self):
        no_data_duration = 0

        while True:
            if no_data_duration >= 5:
                break

            data = await SSHModule.read(self.group_name)
            if data is not None:
                no_data_duration = 0
                await self.send_group_message_inclusive(data)
            else:
                no_data_duration += 0.1

            await asyncio.sleep(0.1)
