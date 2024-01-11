from django import forms
from django.utils.safestring import mark_safe
from terminal.models import SavedHost
# class ColoredRadioSelect(forms.RadioSelect):
#     template_name = 'widgets/colored_radio_select.html'  # Create this template in your templates/widgets directory

#     def get_context(self, name, value, attrs):
#         context = super().get_context(name, value, attrs)
#         context['widget']['attrs']['class'] = f'color: {value};'  # Add a class to the radio inputs
#         return context
class SSHDataForm(forms.Form):
    buttons = [
        "<button class='btn btn-success rounded-pill px-5 m-1' value='open' name='submit' type='submit' >Open</button>",
        "<button class='btn btn-info rounded-pill px-5 m-1' value='save' name='submit' onclick='updateSaveSessionsEvent()' type='submit' >Save and Open</button>"
    ]

    @property
    def form_buttons(self):
        return mark_safe(" ".join(self.buttons))

    name = forms.CharField(max_length=100, required=False, label="Session name", initial='New Session')
    session_open = forms.BooleanField(initial=False, required=False, help_text='This flags informs if other users can join this session')
    hostname = forms.CharField(max_length=255, required=False, help_text='The hostname of the host.')
    ip = forms.GenericIPAddressField(required=False, help_text='The IP address of the saved host.')
    port = forms.IntegerField(initial=22, help_text='The port number for accessing the host.')

    username = forms.CharField(max_length=255, required=False, help_text='The username for accessing the host.')
    password = forms.CharField(widget=forms.PasswordInput, required=False, help_text='The password for accessing the host.')
    private_key = forms.CharField(widget=forms.Textarea(attrs={'rows': 2}), required=False, help_text='The private key for SSH access (if applicable).')
    passphrase = forms.CharField(widget=forms.PasswordInput, required=False, help_text='The passphrase for the private key (if applicable).')
    # color = forms.ChoiceField(
    #     choices=SavedHost.COLOR_PALETTE,
    #     widget=ColoredRadioSelect,
    # )

    field_groups = [
        'name', 'session_open',
        ('Connection details:', ('hostname', 'ip', 'port')),
        ('Authentication:', ('username', 'password')),
        'private_key', 'passphrase',# 'color'
    ]

    def clean(self, *args, **kwargs):
        ip = self.cleaned_data.get('ip')
        private_key = self.cleaned_data.get('private_key')
        passphrase = self.cleaned_data.get('passphrase')
        hostname = self.cleaned_data.get('hostname')
        port = self.cleaned_data.get('port')
        errors = {}

        if not private_key and passphrase:
            errors['passphrase'] = 'Private key cannot be empty if passphrase is given!'

        if not hostname and not ip:
            errors['hostname'] = 'IP or hostname is required.'
            errors['ip'] = 'IP or hostname is required.'

        if not port:
            errors['port'] = 'Port is required.'

        if errors:
            raise forms.ValidationError(errors)

        return super().clean()

class ReconnectForm(forms.Form):
    username = forms.CharField(max_length=255, required=False)
    password = forms.CharField(widget=forms.PasswordInput, required=False)
    private_key = forms.CharField(widget=forms.Textarea(attrs={'rows': 2}), required=False)
    passphrase = forms.CharField(widget=forms.PasswordInput, required=False)

    field_groups = [
        'username',
        'password',
        ('private_key', 'passphrase'),
    ]