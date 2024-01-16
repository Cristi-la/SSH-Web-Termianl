from typing import Any
from django.http import HttpRequest
from django.http.response import HttpResponse as HttpResponse, HttpResponse
from django.shortcuts import render, redirect
from django.views.generic import TemplateView, RedirectView
from terminal.models import SSHData, NotesData, SessionsList, SavedHost, AccountData, BaseData
from terminal.forms import SSHDataForm, ReconnectForm
from django.urls import reverse, reverse_lazy
from web.templates import TemplateSession, TemplateCreateSession, decoded_data
from django.shortcuts import get_object_or_404
from terminal.responses import (
    SESSION_CLOSED, SESSION_UPDATED, ALL_SESSION_CLOSED, SAVED_SESSION_CLOSED, 
    NO_MANDATORY_PARAMS, SESSION_SHARING_DISABLED, NO_SESSION_JOIN,
    SESSION_ALREADY_JOINED, NO_PERMISSIONS
)
from django.template import RequestContext
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from web.settings import COLOR_PALETTE
from django.views.decorators.cache import never_cache
from django.utils.decorators import method_decorator
# ----------------------
#  SSH session handling
# ----------------------

class SSHDetailView(TemplateSession):
    template_name  = 'views/terminals/ssh.html'
    model = SSHData
    permission_required = SSHData.get_access_permission()

    def get_additional_context(self,  *args, **kwargs):
        context = super().get_additional_context(*args, **kwargs)

        context.update({
            'form': ReconnectForm(),
        })
        return context

class SSHCreateView(TemplateCreateSession): #DONE
    model = SSHData  
    queryset = SSHData.objects.none()
    permission_required = SSHData.get_access_permission()
    form_class = SSHDataForm
    prompt = 'Create SSH session'

    def get_additional_context(self,  *args, **kwargs):
        context = super().get_additional_context(*args, **kwargs)

        context.update({
            'save': bool(self.request.POST.get('submit', 'open') == 'save'),
        })

        return context


class NoteDetailView(TemplateSession):
    template_name  = 'views/terminals/note.html'
    model = NotesData
    context_object_name = 'notedata'
    permission_required = NotesData.get_access_permission()

class NoteCreateView(TemplateCreateSession):
    permission_required = NotesData.get_access_permission()
    model = NotesData  
    queryset = NotesData.objects.none()
    prompt = 'Create Note'


class TermianlView(LoginRequiredMixin, TemplateView):
    template_name  = 'views/terminal.html'

    @method_decorator(never_cache)
    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        return super().dispatch(request, *args, **kwargs)
    
    @method_decorator(never_cache)
    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        data = decoded_data(self.request.body)
        sid = data.get('sid', False)
        sessions = SessionsList.objects.filter(user=self.request.user) 

        if sid:
            sessions.filter(pk=sid)

        sessions_list = {'sessions': []}
        sessions_list['sid'] = sid

        for session in sessions:
            sessions_list['sessions'].append(
                session.get_session_dict(request.user)
            )

        return JsonResponse(sessions_list, status=200)
    
    def delete(self, request, *args, **kwargs):
        user = self.request.user
        data = decoded_data(self.request.body)

        if 'save_session' in data and data.get('save_session'):
            save_session_id = data.get('save_session')

            save_session = SavedHost.objects.get(user=user, pk=save_session_id) 
            save_session.delete()

            return SAVED_SESSION_CLOSED
        else:
            sessions = SessionsList.objects.filter(user=user) 

            for session in sessions:
                session.close()

            return ALL_SESSION_CLOSED
    
    def patch(self, request, *args, **kwargs):
        samples = {
            'samples': COLOR_PALETTE,
            'saved_sessions': list(SavedHost.objects.filter(user=self.request.user).values(
                'name', 'hostname', 'ip', 'color', 'pk', 'port', 'created_at','private_key'
            ))
        }

        return JsonResponse(samples, status=200)
    
    @method_decorator(never_cache)
    def put(self, request, *args, **kwargs):
        user = self.request.user
        data = decoded_data(self.request.body)

        if 'session_key' in data:
            session_key = data.get('session_key')

            session, created = SessionsList.joinWithOutContext(user=user, session_key=session_key)

            if not session and created:
                return NO_PERMISSIONS
            elif not session and not created:
                return NO_SESSION_JOIN
            elif not session and not created:
                return SESSION_ALREADY_JOINED

            return JsonResponse({'session':  session.get_session_dict(user)}, status=200)

            
        elif 'save_session' in data and data.get('save_session'):
            save_session_id = data.get('save_session')
            save_session = SavedHost.objects.get(user=user, pk=save_session_id) 

            ssh_data, session = SSHData.open(
                user  = user,
                name = save_session.name,
                hostname = save_session.hostname,
                username = save_session.username,
                password = save_session.password,
                private_key = save_session.private_key,
                passphrase = save_session.passphrase,
                port = save_session.port,
                ip = save_session.ip,
                save = False,
                session_open = False,
                save_session = save_session,
                color = save_session.color
            )

            return JsonResponse({'session_id':  session.pk}, status=200)
        return NO_MANDATORY_PARAMS

#  BASE VIEWS:
class TerminalCreatView(LoginRequiredMixin, TemplateView):
    template_name = 'views/create.html'

    def dispatch(self, request, *args, **kwargs):
        request.apply_custom_headers = True
        return super().dispatch(request, *args, **kwargs)


class TerminalJoinView(RedirectView):
    permanent = False
    query_string = True
    pattern_name = 'terminal'

    def get_redirect_url(self, *args, **kwargs):
        user = self.request.user
        session_key = kwargs.pop('session_key', None)

        if not session_key:
            messages.error(self.request, 'Wrong url!')
            return super().get_redirect_url(*args, **kwargs)

        session, created = SessionsList.joinWithOutContext(user=user, session_key=session_key)

        if not session and created:
            messages.error(self.request, 'You have locked access to this functionality. Please contact administrator to recive access to this feature!!')
            return self.get_redirect_url(*args, **kwargs)
        elif not session and not created:
            messages.error(self.request, 'Wrong url!!')
            return self.get_redirect_url(*args, **kwargs)
        elif  session and not created:
            messages.error(self.request, 'Session already joined!')
        elif session and created:
            messages.success(self.request, 'Session joined!')

        return f'{reverse(self.pattern_name)}?select={session.pk}'


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



def handler403(request, *args, **argv):
    response = render(request, '403.html', {})
    response.status_code = 403
    return response


def handler404(request, *args, **argv):
    response = render(request, '404.html', {})
    response.status_code = 404
    return response


def handler500(request, *args, **argv):
    response = render(request,'500.html', {})
    response.status_code = 500
    return response