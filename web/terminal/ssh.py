import socket
import paramiko
import asyncio
import json

class SSHModule:
    instances = {}
    active_connections = {}

    def __init__(self, *args, **kwargs):
        self.ssh = None
        self.channel = None

    @classmethod
    async def get_or_create_instance(cls, group_name, host, username, password, port):
        if group_name not in cls.instances:
            instance = cls()
            await instance.connect(host, username, password, port)
            cls.instances[group_name] = instance
            cls.active_connections[group_name] = 1
        else:
            cls.active_connections[group_name] += 1

        return cls.instances[group_name]

    async def connect(self, host, username, password, port):
        try:
            self.ssh = paramiko.SSHClient()
            self.ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            loop = asyncio.get_running_loop()

            if port is None:
                port = 22

            await loop.run_in_executor(None, self.ssh.connect, host, port, username, password)

            transport = await loop.run_in_executor(None, self.ssh.get_transport)
            self.channel = await loop.run_in_executor(None, transport.open_session)
            await loop.run_in_executor(None, lambda: self.channel.get_pty(term='xterm'))
            await loop.run_in_executor(None, self.channel.invoke_shell)
            self.channel.setblocking(0)
        except Exception as e:
            return {'error': str(e)}

    async def disconnect(self):
        for group_name, instance in SSHModule.instances.items():
            if instance is self:
                print('delete one connection with: ', group_name)
                SSHModule.active_connections[group_name] -= 1

                if SSHModule.active_connections[group_name] == 0:
                    print('No other connection for: ', group_name)
                    if self.channel:
                        self.channel.close()
                    if self.ssh:
                        self.ssh.close()

                    del SSHModule.instances[group_name]
                    del SSHModule.active_connections[group_name]
                break


    async def input_data(self, data):
        if not self.channel or not self.channel.active:
            return

        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, self.channel.send, data)

    async def read_data(self):
        if not self.channel or not self.channel.active:
            return
        loop = asyncio.get_event_loop()
        try:
            data = await loop.run_in_executor(None, self.channel.recv, 1024)
            decoded_data = data.decode('utf-8')
            return decoded_data
        except (paramiko.buffered_pipe.PipeTimeout, socket.timeout):
            pass
