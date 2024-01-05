from typing import Self
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from colorfield.fields import ColorField
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from encrypted_model_fields.fields import EncryptedCharField
from django.core.exceptions import ValidationError
from abc import ABCMeta, abstractmethod

class AccManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(username, password, **extra_fields)

class AccountData(AbstractBaseUser, PermissionsMixin):
    saved_hosts: 'SavedHost'
    sessions: 'SessionsList'
    sessions: 'SessionsList'

    email = models.EmailField(max_length=40, unique=False, help_text='The email address of the user.')
    first_name = models.CharField(max_length=30, blank=True, null=True, help_text='The first name of the user.')
    last_name = models.CharField(max_length=30, blank=True, null=True, help_text='The last name of the user.')
    username = models.CharField(max_length=30, unique=True, help_text='The username of the user.')
    is_active = models.BooleanField(default=True, help_text='Designates whether this user should be treated as active.')
    is_staff = models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.')
    is_superuser = models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.')
    date_joined = models.DateTimeField(auto_now_add=True, help_text='The date and time when the user joined.')
    
    objects = AccManager()

    USERNAME_FIELD = 'username'
    # REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

class SavedHost(models.Model):
    user = models.ForeignKey('AccountData', on_delete=models.CASCADE, related_name='saved_hosts', default=None, help_text='The user associated with the saved host.')
    ip_address_v4 = models.GenericIPAddressField(protocol='IPv4', blank=True, null=True, help_text='The IPv4 address of the saved host.')
    ip_address_v6 = models.GenericIPAddressField(protocol='IPv6', blank=True, null=True, help_text='The IPv6 address of the saved host.')
    hostname = models.CharField(max_length=255, unique=True, help_text='The hostname of the saved host.')
    username = models.CharField(max_length=255, blank=True, null=True, help_text='The username for accessing the saved host.')
    password = EncryptedCharField(max_length=500, blank=True, null=True, help_text='The password for accessing the saved host.')

    # Key-related fields
    private_key = models.TextField(blank=True, null=True, help_text='The private key for SSH access (if applicable).')
    # public_key = models.TextField(blank=True, null=True, help_text='The public key for SSH access (if applicable).')
    passphrase = EncryptedCharField(max_length=500, blank=True, null=True, help_text='The passphrase for the private key (if applicable).')

    # Additional fields
    port = models.PositiveIntegerField(default=22, blank=True, null=True, help_text='The port number for accessing the saved host.')
    created_at = models.DateTimeField(auto_now_add=True, help_text='The date and time when the saved host was created.')
    updated_at = models.DateTimeField(auto_now=True, help_text='The date and time when the saved host was last updated.')
    color = ColorField(format="hexa")

    def __str__(self):
        if self.hostname is None:
            return "~Config"
        return f"{self.hostname}"
    
# 
#  SESSIONS DATA
# 
class Log(models.Model):
    notedata_logs: 'NotesData'
    sshdata_logs: 'SSHData'

    log_text = models.TextField(help_text='Log entry text.')
    created_at = models.DateTimeField(auto_now_add=True, help_text='The date and time when the log entry was created.')

    def __str__(self):
        return f"Log {self.created_at}: {self.log_text}"


# FIX m
class AbstractModelMeta(ABCMeta, type(models.Model)):...
class BaseData(models.Model, metaclass=AbstractModelMeta):
    log: Log

    name = models.CharField(max_length=100, default='Session', help_text='Default name of the tab in fronend.')
    created_at = models.DateTimeField(auto_now_add=True, help_text='The date and time when the data was created.')
    updated_at = models.DateTimeField(auto_now=True, help_text='The date and time when the data was last updated.')
    
    # Logs related table
    logs = models.ManyToManyField(Log, related_name='%(class)s_logs', blank=True, help_text='Logs related to this data.')

    # User who created the session
    session_master = models.ForeignKey(AccountData, on_delete=models.CASCADE, null=False, blank=False, help_text='The user who created the session.')
    session_lock = models.BooleanField(default=True, help_text='This flags informs if other session users (except master) can iteract with terminal')
    session_open = models.BooleanField(default=False, help_text='This flags informs if other users can join this session')
    sessions = GenericRelation('SessionsList', related_query_name='session')

    class Meta:
        abstract = True  # This makes BaseData an abstract model, preventing database table creation.

    def __str__(self):
        return self.name
    
    def _get_session_count(self, is_active=None):
        content_type = ContentType.objects.get_for_model(self.__class__, for_concrete_model=True)
        queryset = SessionsList.objects.filter(
            object_id=self.pk,
            content_type=content_type,
        )
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        return queryset.count()

    def get_sessions_count(self):
        return self._get_session_count()

    def get_active_sessions_count(self):
        return self._get_session_count(is_active=True)

    @abstractmethod
    def close(self, request, *args, **kwargs) -> None:
        '''
        '''
    
    @abstractmethod
    def open(self, request, *args, **kwargs) -> Self:
        '''
        '''

       


class NotesData(BaseData):
    TASK_READER = False
    # logs = GenericRelation(Log, related_query_name='notesdata_logs', blank=True, help_text='Logs related to this notes data.')

    def __str__(self):
        return f"Note: {self.name}"

class SSHData(BaseData):
    TASK_READER = True
    # logs = GenericRelation(Log, related_query_name='sshdata_logs', blank=True, help_text='Logs related to this SSH data.')

    def __str__(self):
        return f"SSH Connection: {self.name}"
    
    def close(self):
        # TODO: Close user session in consumers and SSHModule:

        self.delete()

    @classmethod
    def open(cls, name, user, ip, username, password, private_key, passphrase):
        ssh_data = cls.objects.create(
            session_master=user,
            # TODO: DODAJ DO MODELU JAKIES DODATKOWE POLA JAK POTRZEBUJESZ:
            # ...W SSHData
        )
        ssh_data.save()

        session = SessionsList.objects.create(
            name = name,
            user = user,
            content_type=ContentType.objects.get_for_model(cls),
            object_id=ssh_data.id
        )

        session.save()

        log_entry = Log.objects.create(
            log_text=f"Session created by {user.username} for SSHData: {ssh_data.name}",
        )

        log_entry.save()

        # SERVER --> REMOTE PC. reutrn True

        # TODO: OPEN SSH session using: ip, username, password, private_key, passphrase

        ssh_data.logs.add(log_entry)

        return ssh_data

class SessionsList(models.Model):
    name = models.CharField(max_length=100, default='Session', help_text='Name of the tab in fronend.')
    user = models.ForeignKey(AccountData, on_delete=models.CASCADE, related_name='sessions', help_text='The user associated with the session.')
    sharing_enabled = models.BooleanField(default=False, help_text='Flag indicating if sharing is enabled for the session.')
    is_active = models.BooleanField(default=True, help_text='Flag indicating if the session is active.')
    color = ColorField(format="hexa", help_text="Tab color")

    # GenericForeignKey to reference either SSHData or NotesData
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, limit_choices_to={'model__in': ['sshdata', 'notesdata']})
    object_id = models.PositiveIntegerField(null=False)
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        # To session form the same user to Session Data can not exist
        unique_together = ['user', 'content_type', 'object_id']

    def clean(self):
        content_type = self.content_type
        object_id = self.object_id
        
        if content_type and object_id:
            try:
                content_type.get_object_for_this_type(pk=object_id)
            except content_type.model_class().DoesNotExist:
                raise ValidationError(f"The object with id {object_id} does not exist for the specified content type.")
            
        if not object_id:
            raise ValidationError(f"The object id can not be negative.")
        

    def __str__(self):
        return f"{self.user.username}'s session {self.pk}"
    
    @classmethod
    def join(cls, user, data_obj, name):
        session, _ = cls.objects.get_or_create(
            user = user,
            content_type=ContentType.objects.get_for_model(data_obj),
            object_id=data_obj.id
        )

        session.name = name if name else data_obj.name
        session.save()

        return session

    def close(self):
        self.delete()
