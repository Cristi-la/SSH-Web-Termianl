from typing import Any
from django.shortcuts import render
from django.views.generic import TemplateView, RedirectView
from django.views.generic.detail import DetailView
from terminal.models import SSHData, NotesData, SessionsList
from django.shortcuts import render, redirect
from terminal.forms import SSHDataForm
from django.urls import reverse, reverse_lazy
from web.templates import TemplateSession, TemplateCreateSession
from django.shortcuts import get_object_or_404
from terminal.models import AccountData
from terminal.responses import (
    SESSION_CLOSED,
)
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.mixins import LoginRequiredMixin
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
    template_name  = 'views/both_terminal.html'


#  BASE VIEWS:
class LoginView(TemplateView):
    template_name = 'views/login.html'
    extra_context = {'title': 'login'}

    def get_context_data(self, **kwargs: Any) -> dict:
        contex = super().get_context_data(**kwargs)

        if self.request.method == 'POST':
            contex['password'] = self.request.POST.get('password')
        contex['remember_me'] = self.request.POST.get('remember_me')
        contex['username'] = self.request.POST.get('username')

        return contex

    def handle_session(self, keep_alive):
        if not keep_alive:
            self.request.session.set_expiry(0)

    def handle_auth(self, user) -> bool:
        if user is None:
            messages.error(
                self.request, 'Invalid credentials. Please try again.')

        elif not user.is_active:
            messages.error(
                self.request, 'Account is locked. Please contact platform administrators')
        else:
            messages.success(self.request, 'Login successful!')

        return user is None or not user.is_active

    def post(self, request):
        context = self.get_context_data()

        user: AccountData = authenticate(
            self.request,
            username=context['username'],
            password=context['password']
        )  # type: ignore

        if self.handle_auth(user):
            return self.render_to_response(context)

        login(self.request, user)
        self.handle_session(context['remember_me'])

        return redirect('terminal')


class LogoutView(LoginRequiredMixin, RedirectView):
    url = reverse_lazy('login')

    def get(self, request, *args, **kwargs):
        logout(request)
        messages.success(request, 'Logout successful!')
        return super().get(request, *args, **kwargs)    


