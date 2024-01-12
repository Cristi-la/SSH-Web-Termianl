from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.http import HttpResponseForbidden
from terminal.models import SessionsList,SSHData, AccountData
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType

class SessionPermissionMixin:
    """Mixin class for handling permissions."""

    @method_decorator(login_required(login_url='/login/'))
    def dispatch(self, request, *args, **kwargs):

        user: AccountData = self.request.user
        session_obj: SSHData = super().get_object()

        if request.method in "POST" and (session_obj.session_open or session_obj.session_master == request.user):
            return super().dispatch(request, *args, **kwargs)

        if request.method in ("DELETE", "PATCH", "GET"):
            user_session_obj: SessionsList = get_object_or_404(
                SessionsList, 
                user=user, 
                content_type=ContentType.objects.get_for_model(session_obj), 
                object_id=session_obj.pk
            )

            return super().dispatch(request, *args, **kwargs)

        # Deny access and return a forbidden response
        return HttpResponseForbidden(f"Denied access for {request.method}.")
        
        