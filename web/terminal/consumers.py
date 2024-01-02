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
        # await self.channel_layer.group_add('sxddsds', self.channel_name)
        await self.accept()
        # session_id = self.scope['url_route']['kwargs']['session_id']

        # if not session_id:
        #     await self.close()

        # try:
        #     # obj = await self.get_session(session_id)
        #     # if obj.user.pk == self.scope['user'].pk:
        #     await self.channel_layer.group_add('test'+str(111), self.channel_name)
        #     await self.accept()

        # except SessionsList.DoesNotExist:
        #     pass
        # except Exception as e:
        #     print(e)
        #     await self.close()



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
