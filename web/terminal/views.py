from django.shortcuts import render
from django.views.generic import TemplateView
from django.views.generic.detail import DetailView
from terminal.models import SSHData, NotesData, SessionsList
from django.shortcuts import render, redirect
from terminal.forms import SSHDataForm
from django.urls import reverse
from web.templates import TemplateSession, TemplateCreateSession
from django.shortcuts import get_object_or_404
from terminal.responses import (
    SESSION_CLOSED,
)

# ----------------------
#  SSH session handling
# ----------------------

class SSHDetailView(TemplateSession):
    template_name  = 'ssh.html'
    model = SSHData

    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def get_object(self, queryset=None) -> SSHData:
        return get_object_or_404(SSHData, pk=self.kwargs['pk']) 

    def post(self, request, *args, **kwargs): # DONE
        # Currently to join session: self.object need to have flag "session_open" set to True
        session = SessionsList.join(
            user=self.request.user,
            data_obj = self.get_object(),
            name = self.request.POST.get('name'),
        )

        return self.get(request, *args, **kwargs)

    def get(self, request, *args, **kwargs): # DONE
        data_obj = self.get_object()

        basic_data = {
            'object': data_obj,
            'user_object': data_obj.sessions.get(user=self.request.user),
        }
        return render(request, self.template_name, basic_data)
    
    def delete(self, request, *args, **kwargs): #DONE
        obj = self.get_object()

        self.get_object().sessions.get(user=self.request.user).close()

        return SESSION_CLOSED
    
    def patch(self, request, *args, **kwargs):
        # TODO: WORK IN PROGRESS FOR K.S.
        ...

class SSHCreateView(TemplateCreateSession): #DONE
    model = SSHData  
    queryset = SSHData.objects.none()
    form_class = SSHDataForm
    
    def get(self, request, *args, **kwargs):
        form = self.get_form()

        return render(
            request, 
            self.template_name, 
            {
                'form': form,
                'action': reverse('ssh.create')
            }
        )
    
    def post(self, request, *args, **kwargs):
        form = self.get_form()

        if form.is_valid():
            self.object = SSHData.open(
                user=self.request.user,
                **form.cleaned_data
            )

            return redirect('ssh.detail', pk=self.object.pk)
        
        return render(request, self.template_name, {'form': form})

# WORK IN PROGRESS
class NoteDetailView(DetailView):
    template_name  = 'note.html'
    model = NotesData
    context_object_name = 'notedata'

class TermianlView(TemplateView):
    template_name  = 'terminal_copy.html'


