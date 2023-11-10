import json
import paramiko
import asyncio
from channels.generic.websocket import WebsocketConsumer, AsyncWebsocketConsumer
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


class SshConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.ssh = None
        await self.accept()

    async def disconnect(self, close_code):
        if self.ssh:
            self.ssh.close()

    async def ssh_connect(self, host, username, password):
        try:
            self.ssh = paramiko.SSHClient()
            self.ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, self.ssh.connect, host, 22, username, password)

            await self.send(text_data=json.dumps({'output': 'Connected to SSH'}))
        except Exception as e:
            await self.send(text_data=json.dumps({'error': str(e)}))

    async def execute_ssh_command(self, command):
        try:
            loop = asyncio.get_running_loop()
            stdin, stdout, stderr = await loop.run_in_executor(None, self.ssh.exec_command, command)

            line_buffer = ""
            while not stdout.channel.exit_status_ready():
                while stdout.channel.recv_ready():
                    char = stdout.channel.recv(1).decode('utf-8')
                    line_buffer += char
                    if char == '\n':
                        await self.send(text_data=json.dumps({'output': line_buffer + "nnnnnnnnn"}))
                        line_buffer = ""
                    elif char == '\r':
                        await self.send(text_data=json.dumps({'output': line_buffer + "rrrrrr"}))
                        line_buffer = ""

                await asyncio.sleep(0.1)  # Sleep to prevent high CPU usage

            if line_buffer:
                await self.send(text_data=json.dumps({'output': line_buffer}))

            output_remaining = stdout.read().decode('utf-8').strip()
            error = stderr.read().decode('utf-8').strip()
            await self.send(text_data=json.dumps({'output': output_remaining, 'error': error}))

        except Exception as e:
            await self.send(text_data=json.dumps({'error': str(e)}))

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        command = text_data_json.get('command')

        if command == 'ssh_connect':
            await self.ssh_connect(
                text_data_json.get('host'),
                text_data_json.get('username'),
                text_data_json.get('password')
            )
        elif command == 'execute_ssh_command':
            await self.execute_ssh_command(text_data_json.get('commandText'))
