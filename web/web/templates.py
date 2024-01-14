from abc import ABC, abstractmethod
from django.views.generic.detail import DetailView
from django.views.generic.edit import CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from terminal.permissions import SessionPermissionMixin
from terminal.models import BaseData
from django.forms import Form
from django.db.models.query import QuerySet
from django.shortcuts import render, redirect
from django.urls import reverse, reverse_lazy
from django import forms
from django.utils.safestring import mark_safe
from dataclasses import dataclass
from django.http import JsonResponse
import json
from web.settings import COLOR_PALETTE
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404

class CustomRadioSelect(forms.RadioSelect):
    template_name = 'terminal/custom/color_radio.html'  # Create a custom template

@dataclass(frozen=True)
class BaseApiCallReponse:
    ''' Basic Api data structure use to communicate with fronend '''
    success: bool
    message: str
    data: dict = None
    status: int = 200

    def to_json_response(self):
        return JsonResponse(self.__dict__, status=self.status)

def decoded_data(body):
    decoded_body = body.decode('utf-8')
    if decoded_body:
        return json.loads(body.decode('utf-8'))
    return {}

class TerminalBaseForm(forms.Form):
    buttons = (
        "<button class='btn btn-success rounded-pill px-5 m-1' value='open' name='submit' type='submit' >Open</button>",
    )

    @property
    def form_buttons(self):
        return mark_safe(" ".join(self.buttons))

    name = forms.CharField(max_length=100, required=True, label="Session name", initial='New Session')
    session_open = forms.BooleanField(initial=False, required=False, help_text='This flags informs if other users can join this session')
    color = forms.ChoiceField(
        choices=COLOR_PALETTE,
        widget=CustomRadioSelect,
        required=False
    )

    def clean(self, *args, **kwargs):
        name = self.cleaned_data.get('name')
        if not name:
            raise forms.ValidationError({'name': 'Session name can not be empty'})

        return super().clean()


class TemplateSession(ABC, SessionPermissionMixin, DetailView):
    http_method_names: tuple[str] = ('patch','post', 'get', 'delete')
    template_name: str
    model: BaseData

    def get_additional_context(self,  *args, **kwargs) -> dict:
        return {
            'enable_pass': True
        }

    def dispatch(self, request, *args, **kwargs):
        request.apply_custom_headers = True
        return super().dispatch(request, *args, **kwargs)


    def get_object(self, queryset=None) -> BaseData:
        return get_object_or_404(self.model, pk=self.kwargs['pk']) 

    def patch(self, request, *args, **kwargs):
        '''
        Method used for manage session. (if user have sufficient permissions to object)
        - Example Sharing, Saving
        - always return json response.
        '''
        master_fields = ('session_master', 'session_lock', 'session_open', 'name')
        user_fields = ('name', 'color')
        obj = self.get_object()

        dat = decoded_data(self.request.body)

        if dat.get('color') == '-':
            dat['color'] = COLOR_PALETTE[0]

        if obj.session_master == self.request.user:
            session_master_dict = {k: dat.get(k) for k in master_fields if k in dat and dat.get(k)}
            if session_master_dict:
                obj.update_obj(session_master_dict)

        
        session_user_dict = {k: dat.get(k) for k in user_fields if k in dat and dat.get(k)}
        if session_user_dict:
            obj.sessions.get(user=self.request.user).update_obj(session_user_dict)

        return BaseApiCallReponse(
            success=True,
            message='Session updated successfully.',
            status = 200 
        ).to_json_response()

    def post(self, request, *args, **kwargs):
        '''
        Method retrieve already existing session object (row in DB) (if user have sufficient permissions to object).
        - After successful retrieval of object method forward request to GET method.
        - After unsuccessful retrieval method return json response.
        - Via method every parameters can be send.
        '''

        obj = self.get_object()
        data = decoded_data(self.request.body)

        if obj.session_master != request.user:
            return HttpResponseForbidden(f"Denied access for {request.method}.")
        
        if data.get('get', False):
            return JsonResponse({'session_key': obj.session_key}, status=200)

        if data.get('share', False):
            return JsonResponse({'session_key':  obj.setup_sharing()}, status=200)
            
        obj.stop_sharing()
        return BaseApiCallReponse(
            success=True,
            message='Session shared disabled',
            status = 200 #
        ).to_json_response()

    def get(self,  request, *args, **kwargs):
        ''' 
        Method returns view (html,css,js) of already created session (if user have sufficient permissions to object).
        - Method can pass to view basic parametrs to simplify implementation.
        '''

        data_obj = self.get_object()
        additional_params = self.get_additional_context() if self.get_additional_context else {}

        basic_data = {
            'object': data_obj,
            'user_object': data_obj.sessions.get(user=self.request.user),
            **additional_params
        }

        return render(request, self.template_name, basic_data)

    def delete(self,  request, *args, **kwargs):
        '''
        Method removes user session object (row in DB) or removes system session object (if user have sufficient permissions to object).

        "user session" -  relies on "system session". Many users can connect to "system session"
        "system session" - if it is closed/removed all "user session" are removed

        - After successful/unsuccessful retrieval method return json response.
        - Only information which type of session can be passed
        - Only session master can remove system session
        '''

        obj = self.get_object()
        obj.sessions.get(user=self.request.user).close()

        return BaseApiCallReponse(
            success=True,
            message='Session deleted.',
            status = 200 
        ).to_json_response()

class TemplateCreateSession(ABC, LoginRequiredMixin, CreateView):
    template_name: str = 'views/form.html'
    http_method_names: tuple[str] = ('get','post',)
    model: BaseData = BaseData  
    queryset: QuerySet
    form_class: Form = TerminalBaseForm
    prompt = 'Create Session'

    def dispatch(self, request, *args, **kwargs):
        request.apply_custom_headers = True
        return super().dispatch(request, *args, **kwargs)
    
    def get_additional_context(self,  *args, **kwargs) -> dict:
        return {}

    def post(self,  request, *args, **kwargs):
        '''
        Method create NEW session object (row in DB).
        - After successful creation of object method forward request to TemplateSession GET method.
        - After unsuccessful retrieval method return json response.
        - Via method confidential parameters can be send.
        '''
        additional_params = self.get_additional_context() if self.get_additional_context else {}
        form = self.get_form()

        if form.is_valid():
            data_obj, session = self.model.open(
                user=self.request.user,
                **form.cleaned_data,
                **additional_params
            )

            return redirect(data_obj.url, pk=data_obj.pk)
        
        return render(request, self.template_name, {'form': form})

    def get(self, request, *args, **kwargs):
        '''
        Method create form which can be filled with NEW session data...
        - After successful form send request forwards to POST method.
        '''

        return render(
            request, 
            self.template_name, 
            {
                'form':  self.get_form(),
                'prompt': self.prompt,
            }
        )

