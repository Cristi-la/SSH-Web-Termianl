import socket
import paramiko
from paramiko.ssh_exception import AuthenticationException, SSHException, BadHostKeyException, \
    NoValidConnectionsError, PasswordRequiredException
import asyncio
from io import StringIO
from terminal.errors import ReconnectRequired


class SSHModule:
    instances = {}
    channels = {}
    active_connections = {}
    terminal_sizes = {}

    @classmethod
    async def connect_or_create_instance(cls, group_name, host, username, password, port=None, pkey=None,
                                         passphrase=None):
        instance = cls()
        try:
            ssh = await instance.__connect(host, username, password, port, pkey, passphrase)
        # TODO: For future cleanup if we do not want to manage specific exceptions
        except BadHostKeyException:
            raise
        except NoValidConnectionsError:
            raise
        except PasswordRequiredException as e:
            raise ReconnectRequired(message=e)
        except AuthenticationException as e:
            raise ReconnectRequired(message=e)
        except SSHException as e:
            raise ReconnectRequired(message=e)
        except socket.error:
            raise
        except Exception:
            raise

        if group_name not in cls.instances:
            cls.instances[group_name] = ssh
            cls.active_connections[group_name] = 1
        else:
            cls.active_connections[group_name] += 1
            ssh.close()

        try:
            await cls.__open_channel(group_name)
        except SSHException:
            raise

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

    @classmethod
    async def __open_channel(cls, group_name):
        if group_name not in cls.channels:
            ssh = cls.instances.get(group_name)
            try:
                loop = asyncio.get_running_loop()
                transport = await loop.run_in_executor(None, ssh.get_transport)
                channel = await loop.run_in_executor(None, transport.open_session)
                await loop.run_in_executor(None, lambda: channel.get_pty(term='xterm'))
                await loop.run_in_executor(None, channel.invoke_shell)
                channel.setblocking(0)
                cls.channels[group_name] = channel
            except Exception:
                raise

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

                if group_name in cls.instances:
                    del cls.instances[group_name]
                if group_name in cls.channels:
                    del cls.channels[group_name]
                if group_name in cls.active_connections:
                    del cls.active_connections[group_name]
                if group_name in cls.terminal_sizes:
                    del cls.terminal_sizes[group_name]

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

    @classmethod
    async def resize_terminals_in_group(cls, group_name, term_min_width, term_min_height):
        if group_name not in cls.terminal_sizes or not cls.terminal_sizes[group_name]:
            return

        min_width = max(term_min_width, min(size[0] for size in cls.terminal_sizes[group_name]))
        min_height = max(term_min_height, min(size[1] for size in cls.terminal_sizes[group_name]))

        channel = cls.channels.get(group_name)
        if channel and channel.active:
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, lambda: channel.resize_pty(width=min_width, height=min_height))

    @classmethod
    async def add_terminals_in_group(cls, group_name, term_width, term_height):
        if group_name not in cls.terminal_sizes:
            cls.terminal_sizes[group_name] = set()
        cls.terminal_sizes[group_name].add((term_width, term_height))

    @classmethod
    async def del_terminals_in_group(cls, group_name, term_width, term_height):
        if group_name in cls.terminal_sizes:
            cls.terminal_sizes.get(group_name, set()).discard((term_width, term_height))

            if not cls.terminal_sizes.get(group_name):
                del cls.terminal_sizes[group_name]

