from abc import ABC, abstractmethod
from django.views.generic.detail import DetailView
from django.views.generic.edit import CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from terminal.permissions import SessionPermissionMixin
from terminal.models import BaseData
from django.forms import Form
from django.db.models.query import QuerySet

class TemplateSession(ABC, SessionPermissionMixin, DetailView):
    http_method_names: tuple[str] = ('patch','post', 'get', 'delete')
    template_name: str
    model: BaseData

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
        - Only session master can remove system session
        '''

class TemplateCreateSession(ABC, LoginRequiredMixin, CreateView):
    template_name: str = 'form.html'
    http_method_names: tuple[str] = ('get','post',)
    model: BaseData  
    queryset: QuerySet
    form_class: Form

    @abstractmethod
    def post(self,  request, *args, **kwargs):
        '''
        Method create NEW session object (row in DB).
        - After successful creation of object method forward request to TemplateSession GET method.
        - After unsuccessful retrieval method return json response.
        - Via method confidential parameters can be send.
        '''

    def get(self, request, *args, **kwargs):
        '''
        Method create form which can be filled with NEW session data...
        - After successful form send request forwards to POST method.
        '''
