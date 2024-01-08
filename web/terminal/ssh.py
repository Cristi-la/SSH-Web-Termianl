import socket
import paramiko
from paramiko.ssh_exception import AuthenticationException, SSHException, BadHostKeyException, \
    NoValidConnectionsError, PasswordRequiredException
import asyncio
from io import StringIO


class SSHModule:
    instances = {}
    channels = {}
    active_connections = {}

    @classmethod
    async def connect_or_create_instance(cls, group_name, host, username, password, port=None, pkey=None,
                                         passphrase=None):
        instance = cls()
        try:
            ssh = await instance.__connect(host, username, password, port, pkey, passphrase)
        except BadHostKeyException:
            raise
        except NoValidConnectionsError:
            raise
        except PasswordRequiredException:
            raise
        except AuthenticationException:
            raise
        except SSHException:
            raise
        except socket.error:
            raise
        except Exception:
            raise

        if group_name not in cls.instances:
            try:
                channel = await cls.__open_channel(ssh)
            except SSHException:
                raise
            cls.instances[group_name] = ssh
            cls.channels[group_name] = channel
            cls.active_connections[group_name] = 1
        else:
            cls.active_connections[group_name] += 1

    @staticmethod
    async def __connect(host, username, password, port, pkey, passphrase):
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        loop = asyncio.get_running_loop()

        if port is None:
            port = 22

        if pkey is not None:
            pkey_str = StringIO(pkey)
            pkey = paramiko.RSAKey.from_private_key(pkey_str, password=passphrase)

        await loop.run_in_executor(None, lambda: ssh.connect(hostname=host, port=port, username=username,
                                                             password=password, pkey=pkey))

        return ssh

    @staticmethod
    async def __open_channel(ssh):
        try:
            loop = asyncio.get_running_loop()
            transport = await loop.run_in_executor(None, ssh.get_transport)
            channel = await loop.run_in_executor(None, transport.open_session)
            await loop.run_in_executor(None, lambda: channel.get_pty(term='xterm'))
            await loop.run_in_executor(None, channel.invoke_shell)
            channel.setblocking(0)

            return channel
        except Exception as e:
            return {'error': str(e)}

    @classmethod
    async def disconnect(cls, group_name):
        if group_name in cls.active_connections:
            cls.active_connections[group_name] -= 1

            if cls.active_connections[group_name] == 0:
                ssh_client = cls.instances.get(group_name)
                channel = cls.channels.get(group_name)

                if channel:
                    channel.close()
                if ssh_client:
                    ssh_client.close()

                del cls.instances[group_name]
                del cls.channels[group_name]
                del cls.active_connections[group_name]

    @classmethod
    async def send(cls, group_name, data):
        channel = cls.channels.get(group_name)

        if not channel or not channel.active:
            raise Exception("Channel closed. Try reconnecting")

        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, channel.send, data)

    @classmethod
    async def read(cls, group_name):
        channel = cls.channels.get(group_name)

        if not channel or not channel.active:
            return

        loop = asyncio.get_event_loop()
        try:
            data = await loop.run_in_executor(None, channel.recv, 1024)
            decoded_data = data.decode('utf-8')
            return decoded_data
        except (paramiko.buffered_pipe.PipeTimeout, socket.timeout):
            pass
