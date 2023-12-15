from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from colorfield.fields import ColorField
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.http import Http404
from encrypted_model_fields.fields import EncryptedCharField
from django.core.exceptions import ValidationError
from web.settings import MAX_SSH_SESSIONS, MAX_NOTE_SESSIONS, MAX_NOTE_SHARING, MAX_SSH_SHARING, MAX_USER_NOTE_SESSIONS, MAX_USER_SSH_SESSIONS
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError

class AccManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, password, **extra_fields)

class AccountData(AbstractBaseUser, PermissionsMixin):
    saved_hosts: 'SavedHost'
    sessions: 'SessionsList'
    sessions: 'SessionsList'

    email = models.EmailField(max_length=40, unique=True, help_text='The email address of the user.')
    first_name = models.CharField(max_length=30, blank=True, null=True, help_text='The first name of the user.')
    last_name = models.CharField(max_length=30, blank=True, null=True, help_text='The last name of the user.')
    username = models.CharField(max_length=30, unique=True, help_text='The username of the user.')
    is_active = models.BooleanField(default=True, help_text='Designates whether this user should be treated as active.')
    is_staff = models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.')
    is_superuser = models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.')
    date_joined = models.DateTimeField(auto_now_add=True, help_text='The date and time when the user joined.')
    
    objects = AccManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

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
        return f"Log entry created at {self.created_at}"

class BaseData(models.Model):
    log: Log

    name = models.CharField(max_length=100, help_text='Name of the data.')
    created_at = models.DateTimeField(auto_now_add=True, help_text='The date and time when the data was created.')
    updated_at = models.DateTimeField(auto_now=True, help_text='The date and time when the data was last updated.')
    
    # Logs related table
    logs = models.ManyToManyField(Log, related_name='%(class)s_logs', blank=True, help_text='Logs related to this data.')

    # User who created the session
    session_master = models.ForeignKey(AccountData, on_delete=models.CASCADE, null=True, blank=True, help_text='The user who created the session.')


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

class NotesData(BaseData):
    def __str__(self):
        return f"Note: {self.name}"

class SSHData(BaseData):
    def __str__(self):
        return f"SSH Connection: {self.name}"

class SessionsList(models.Model):
    user = models.ForeignKey(AccountData, on_delete=models.CASCADE, related_name='sessions', help_text='The user associated with the session.')
    sharing_enabled = models.BooleanField(default=False, help_text='Flag indicating if sharing is enabled for the session.')
    is_active = models.BooleanField(default=True, help_text='Flag indicating if the session is active.')
    color = ColorField(format="hexa", help_text="Tab color")

    # GenericForeignKey to reference either SSHData or NotesData
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, limit_choices_to={'model__in': ['sshdata', 'notesdata']})
    object_id = models.PositiveIntegerField(null=False)
    content_object = GenericForeignKey('content_type', 'object_id')

    # Reverse relations to get SSHData and NotesData associated with this session
    ssh_sessions = GenericRelation(SSHData, related_query_name='session')
    notes = GenericRelation(NotesData, related_query_name='session')

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



# RECEIVERS
    

# @receiver(pre_save, sender=SSHData)
# def check_ssh_session_limits(sender, instance, **kwargs):
#     if instance.pk is None:  # Check if it's a new object being created
#         total_sessions_count = SSHData.objects.count()
#         if total_sessions_count >= MAX_SSH_SESSIONS:
#             raise ValidationError(f"The system has reached the maximum limit of {MAX_SSH_SESSIONS} SSH sessions.")
        
#         if instance.get_sessions_count() >= MAX_SSH_SHARING:
#             raise ValidationError(f"The system has reached the maximum limit of {MAX_SSH_SHARING} SSH sharings for this session.")

# @receiver(pre_save, sender=NotesData)
# def check_note_session_limits(sender, instance, **kwargs):
#     if instance.pk is None:  # Check if it's a new object being created
#         total_sessions_count = NotesData.objects.count()
#         if total_sessions_count >= MAX_NOTE_SESSIONS:
#             raise ValidationError(f"The system has reached the maximum limit of {MAX_NOTE_SESSIONS} note sessions.")
        
#         if instance.get_sessions_count() >= MAX_NOTE_SHARING:
#             raise ValidationError(f"The system has reached the maximum limit of {MAX_NOTE_SHARING} note sharings for this session.")

@receiver(pre_save, sender=SessionsList)
def check_sharing_limits(sender, instance, **kwargs):
    if instance.pk is None:  # Check if it's a new object being created
        content_type = ContentType.objects.get_for_model(instance.content_object.__class__, for_concrete_model=True)

        total_sessions = SessionsList.objects.filter(
            content_type=content_type,
            user = instance.user
        ).count()


        if content_type.model == 'sshdata':
            if total_sessions >= MAX_USER_SSH_SESSIONS:
                raise ValidationError(f"User has reached the maximum limit of {MAX_USER_SSH_SESSIONS} SSH sessions.")

        elif content_type.model == 'notesdata':
            if total_sessions >= MAX_USER_NOTE_SESSIONS:
                raise ValidationError(f"User has reached the maximum limit of {MAX_USER_NOTE_SESSIONS} note sessions.")
        