import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.exceptions import ObjectDoesNotExist
from terminal.models import SessionsList, BaseData
from channels.db import database_sync_to_async

class SessionCosumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.session_id = None
        self.ssh_session_id = None
        self.read_task = None

    @database_sync_to_async
    def __get_session(self):
        try:
            obj: SessionsList = SessionsList.objects.select_related('user', 'content_type').get(pk=self.session_id) # slave
            data_obj: BaseData = obj.content_object # master
        except ObjectDoesNotExist:
            return None, None

        return obj, data_obj

    async def connect(self, *args, **kwargs):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        obj, data_obj = await self.__get_session()
        self.ssh_session_id = str(data_obj.id)
        await self.channel_layer.group_add(self.ssh_session_id, self.channel_name)
        await self.accept()

        if obj.content_type.model == 'sshdata':
            try:
                await data_obj.check_cache_and_update_flag()
                await data_obj.connect()
            except Exception as e:
                await self.send_group_message_inclusive(e)
            self.start_read()

    async def disconnect(self, code):
        obj, data_obj = await self.__get_session()

        if obj is None or data_obj is None:
            return

        if obj.content_type.model == 'sshdata':
            await data_obj.disconnect()

    async def send_group_message_inclusive(self, message):
        if isinstance(message, Exception):
            message = {'type': 'error', 'error_message': str(message)}
        else:
            message = {'type': 'info', 'content': message}

        await self.channel_layer.group_send(
            self.ssh_session_id,
            {
                'type': 'group_message_inclusive',
                'message': message
            }
        )

    async def group_message_inclusive(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)

        data = text_data_json.get('data')
        if data:
            obj, data_obj = await self.__get_session()

            if obj.content_type.model == 'sshdata':
                try:
                    await data_obj.send(data)
                except Exception as e:
                    await self.send_group_message_inclusive(e)
                self.start_read()

    def start_read(self):
        if self.read_task is None or self.read_task.done():
            self.read_task = asyncio.create_task(self.read())

    async def read(self):
        no_data_duration = 0

        while True:
            if no_data_duration >= 5:
                break

            obj, data_obj = await self.__get_session()

            if obj.content_type.model == 'sshdata':
                data = await data_obj.read()
            if data is not None:
                no_data_duration = 0
                await self.send_group_message_inclusive(data)
            else:
                no_data_duration += 0.1

            await asyncio.sleep(0.1)
