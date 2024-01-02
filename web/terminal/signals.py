from web.settings import MAX_SSH_SESSIONS, MAX_NOTE_SESSIONS, MAX_NOTE_SHARING, MAX_SSH_SHARING, MAX_USER_NOTE_SESSIONS, MAX_USER_SSH_SESSIONS
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from terminal.models import SessionsList, SSHData, NotesData
from django.contrib.contenttypes.models import ContentType

@receiver(post_delete, sender=SessionsList)
def sessions_list_deleted(sender, instance, **kwargs):
    if instance.content_object and (
        (not instance.content_object.get_sessions_count()) 
            or 
        (instance.content_object.session_master == instance.user)
    ):
        # also remove data session object if no active sessions
        instance.content_object.close()
    

@receiver(pre_save, sender=SSHData)
def check_ssh_session_limits(sender, instance, **kwargs):
    if instance.pk is None:  # Check if it's a new object being created
        total_sessions_count = SSHData.objects.all().count()
        if total_sessions_count >= MAX_SSH_SESSIONS:
            raise ValidationError(f"The system has reached the maximum limit of {MAX_SSH_SESSIONS} SSH sessions.")
        
        
@receiver(pre_save, sender=NotesData)
def check_note_session_limits(sender, instance, **kwargs):
    if instance.pk is None:  # Check if it's a new object being created
        total_sessions_count = NotesData.objects.all().count()
        if total_sessions_count >= MAX_NOTE_SESSIONS:
            raise ValidationError(f"The system has reached the maximum limit of {MAX_NOTE_SESSIONS} note sessions.")
        

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

            if instance.content_object.get_sessions_count() >= MAX_NOTE_SHARING:
                raise ValidationError(f"The system has reached the maximum limit of {MAX_NOTE_SHARING} note sharings for this session.")
        
        elif content_type.model == 'notesdata':
            if total_sessions >= MAX_USER_NOTE_SESSIONS:
                raise ValidationError(f"User has reached the maximum limit of {MAX_USER_NOTE_SESSIONS} note sessions.")
       
            if instance.content_object.get_sessions_count() >= MAX_SSH_SHARING:
                raise ValidationError(f"The system has reached the maximum limit of {MAX_SSH_SHARING} SSH sharings for this session.")
