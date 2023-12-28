from typing import Any
from django.shortcuts import render
from django.views.generic import TemplateView
from django.views.generic.detail import DetailView
from django.views import View
from terminal.models import SSHData, NotesData, SessionsList
from abc import ABC, abstractmethod
from django.shortcuts import render, redirect
from terminal.responses import (
    NO_MANDATORY_PARAMS,SYSTEM_SESSION_DELETED,
    USER_SESSION_DELETED, INVALID_REQUEST,
    SESSION_CREATED
)

# -----------
#  Templates
# -----------

class TemplateSession(ABC):
    http_method_names = ('patch','post', 'get', 'delete')

    @abstractmethod
    def patch(self, request, *args, **kwargs):
        '''
        Method used for manage session. (if user have sufficient permissions to object)
        - Example Sharing, Saving
        - always return json response.
        '''

    @abstractmethod
    def post(self, request, *args, **kwargs):
        '''
        Method retrieve already existing session object (row in DB) (if user have sufficient permissions to object).
        - After successful retrieval of object method forward request to GET method.
        - After unsuccessful retrieval method return json response.
        - Via method every parameters can be send.
        '''

    @abstractmethod
    def get(self,  request, *args, **kwargs):
        ''' 
        Method returns view (html,css,js) of already created session (if user have sufficient permissions to object).
        - Method can pass to view basic parametrs to simplify implementation.
        '''

    @abstractmethod
    def delete(self,  request, *args, **kwargs):
        '''
        Method removes user session object (row in DB) or removes system session object (if user have sufficient permissions to object).

        "user session" -  relies on "system session". Many users can connect to "system session"
        "system session" - if it is closed/removed all "user session" are removed

        - After successful/unsuccessful retrieval method return json response.
        - Only information which type of session can be passed
        '''

class TemplateCreateSession(ABC):
    http_method_names = ('put',)

    @abstractmethod
    def put(self,  request, *args, **kwargs):
        '''
        Method create NEW session object (row in DB).
        - After successful creation of object method forward request to GET method.
        - After unsuccessful retrieval method return json response.
        - Via method confidential parameters can be send.
        '''


# ----------------------
#  SSH session handling
# ----------------------

class SSHDetailView(TemplateSession, DetailView):
    template_name  = 'terminal.html'
    model = SSHData

    def get_object(self, queryset=None):
        return SSHData.objects.get(pk=self.kwargs['pk'])  


    def post(self, request, *args, **kwargs): # DONE
        # Currently no permission required to join session
        # zaimplementuje jak mi sie zechce YOOO
        session = SessionsList.join(
            user=self.request.user,
            data_obj = self.get_object(),
            name = self.request.POST.get('name'),
        )

        return self.get(request, *args, **kwargs)

    def get(self, request, *args, **kwargs): # DONE
        basic_data = {
            'object': self.get_object()
        }
        return render(request, self.template_name, basic_data)
    
    def delete(self, request, *args, **kwargs): #DONE
        obj = self.get_object()

        # Remove system session
        if obj.session_master == self.request.user and \
           request.DELETE.get('session_type') == 'system':
            obj.close()
            return SYSTEM_SESSION_DELETED
        
        # NOTE: remove user session
        self.get_object().sessions.get(user=self.request.user).close()
        return SYSTEM_SESSION_DELETED
    
    def patch(self, request, *args, **kwargs):
        # TODO: WORK IN PROGRESS FOR K.S.
        ...

class SSHCreateView(TemplateCreateSession, View): #DONE
    model = SSHData  
    queryset = SSHData.objects.none()

    def put(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)

        context.update({
            'name': self.request.PUT.get('name', 'Session'),
            'username': self.request.PUT.get('username'),
            'password': self.request.PUT.get('password'),
            'private_key': self.request.PUT.get('private_key'),
            'passphrase': self.request.PUT.get('passphrase'),
            'ip': self.request.PUT.get('ip'),
            'user': self.request.user,

            # IMPLEMENT LATER:
            # FIELDS: color, sharing_enabled
        })
    
    def create(self, request, *args, **kwargs): # DONE
        context = self.get_context_data(*args, **kwargs) 

        if not context.get('ip'):
            return NO_MANDATORY_PARAMS

        SSHData.open(**context)

        return SESSION_CREATED
    








# WORK IN PROGRESS
class NoteDetailView(DetailView):
    template_name  = 'note.html'
    model = NotesData
    context_object_name = 'notedata'

class TermianlView(TemplateView):
    template_name  = 'terminal copy.html'


