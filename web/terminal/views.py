from typing import Any
from django.http import HttpRequest
from django.http.response import HttpResponse as HttpResponse
from django.shortcuts import render
from django.views.generic import TemplateView, RedirectView
from terminal.models import SSHData, NotesData, SessionsList, SavedHost
from django.shortcuts import render, redirect
from terminal.forms import SSHDataForm, ReconnectForm
from django.urls import reverse, reverse_lazy
from web.templates import TemplateSession, TemplateCreateSession
from django.shortcuts import get_object_or_404
from terminal.models import AccountData
from terminal.responses import (
    SESSION_CLOSED, SESSION_UPDATED, 
)
from django.contrib.contenttypes.models import ContentType
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
import json

def decoded_data(body):
    return json.loads(body.decode('utf-8'))
# ----------------------
#  SSH session handling
# ----------------------

class SSHDetailView(TemplateSession):
    template_name  = 'views/terminals/ssh.html'
    model = SSHData

    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def get_object(self, queryset=None) -> SSHData:
        return get_object_or_404(SSHData, pk=self.kwargs['pk']) 

    def post(self, request, *args, **kwargs): # DONE
        obj = self.get_object()
        # Currently to join session: self.object need to have flag "session_open" set to True
        SessionsList.join(
            user=self.request.user,
            data_obj = obj,
            name = self.request.POST.get('name'),
        )
        return self.get(request, *args, **kwargs)

    def get(self, request, *args, **kwargs): # DONE
        data_obj = self.get_object()
        form = ReconnectForm()

        basic_data = {
            'form': form,
            'object': data_obj,
            'user_object': data_obj.sessions.get(user=self.request.user),
        }
        return render(request, self.template_name, basic_data)
    
    def delete(self, request, *args, **kwargs): #DONE
        obj = self.get_object()

        obj.sessions.get(user=self.request.user).close()

        return SESSION_CLOSED
    
    def patch(self, request, *args, **kwargs):
        session_master_fields = ('session_master', 'session_lock', 'session_open', 'name')
        session_user_fields = ('name', 'color')
        obj = self.get_object()

        data = decoded_data(self.request.body)

        if obj.session_master == self.request.user:
            session_master_dict = {field: data.get(field) for field in session_master_fields if field in data and data.get(field)}
            if session_master_dict:
                obj.update_obj(session_master_dict)

        
        session_user_dict = {field: data.get(field) for field in session_user_fields if field in data and data.get(field)}
        if session_user_dict:
            obj.sessions.get(user=self.request.user).update_obj(session_user_dict)


        return SESSION_UPDATED

class SSHCreateView(TemplateCreateSession): #DONE
    model = SSHData  
    queryset = SSHData.objects.none()
    form_class = SSHDataForm

    def get(self, request, *args, **kwargs):
        form = self.get_form()
        print('AAAAAA')
        return render(
            request, 
            self.template_name, 
            {
                'form': form,
                'action': reverse('ssh.create'),
                'prompt': 'Create SSH session',
            }
        )
    
    def post(self, request, *args, **kwargs):
        form = self.get_form()

        if form.is_valid():
            self.object = SSHData.open(
                user=self.request.user,
                **form.cleaned_data,
                save = bool(self.request.POST.get('submit', 'open') == 'save'),
            )


            return redirect('ssh.detail', pk=self.object.pk)
        
        return render(request, self.template_name, {'form': form})

# WORK IN PROGRESS
class NoteDetailView(TemplateCreateSession):
    template_name  = 'views/terminals/note.html'
    model = NotesData
    context_object_name = 'notedata'

class NoteCreateView(TemplateCreateSession):
    model = NotesData  
    queryset = NotesData.objects.none()
    extra_context = {
        'prompt': 'Open notebook'
    }
    # form_class = SSHDataForm

class TermianlView(LoginRequiredMixin, TemplateView):
    template_name  = 'views/terminal.html'
    samples = {
        'samples': json.dumps(SavedHost.COLOR_PALETTE)
    }

    def get(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        return render(request, self.template_name)
    
    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        data = decoded_data(self.request.body)
        sid = data.get('sid', False)
        sessions = SessionsList.get_sessions_for(user=self.request.user) 

        if sid:
            sessions.filter(pk=sid)

        sessions_list = {'sessions': []}

        for session in sessions:
            content_type = session['content_type']
            object_id = session['object_id']
            model_class = ContentType.objects.get_for_id(content_type).model_class()

            model_instance = get_object_or_404(model_class, pk=object_id)
            session['url'] = model_instance.url
            session['create_url'] = model_instance.create_url
            sessions_list['sessions'].append(session)
        
        return JsonResponse(sessions_list, status=200)

#  BASE VIEWS:
class TerminalCreatView(LoginRequiredMixin, TemplateView):
    template_name = 'views/create.html'

    def dispatch(self, request, *args, **kwargs):
        request.apply_custom_headers = True
        return super().dispatch(request, *args, **kwargs)



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


