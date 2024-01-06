from django import forms
from django.utils.safestring import mark_safe

class SSHDataForm(forms.Form):
    buttons = [
        "<button class='btn btn-success rounded-pill px-5 m-1' value='open' name='submit' type='submit' >Open</button>",
        "<button class='btn btn-info rounded-pill px-5 m-1' value='save' name='submit' type='submit' >Save and Open</button>"
    ]

    @property
    def form_buttons(self):
        return mark_safe(" ".join(self.buttons))

    name = forms.CharField(max_length=100, required=False, initial='Session')
    hostname = forms.CharField(max_length=255, required=False, help_text='The hostname of the host.')
    username = forms.CharField(max_length=255, required=False, help_text='The username for accessing the host.')
    password = forms.CharField(widget=forms.PasswordInput, required=False, help_text='The password for accessing the host.')
    private_key = forms.CharField(widget=forms.Textarea(attrs={'rows': 2}), required=False, help_text='The private key for SSH access (if applicable).')
    passphrase = forms.CharField(widget=forms.PasswordInput, required=False, help_text='The passphrase for the private key (if applicable).')
    port = forms.IntegerField(initial=22, help_text='The port number for accessing the host.')
    ip = forms.GenericIPAddressField(required=False, help_text='The IP address of the saved host.')
    # color = forms.CharField(widget=ColorPickerWidget)

    def clean(self, *args, **kwargs):
        ip = self.cleaned_data.get('ip')
        hostname = self.cleaned_data.get('hostname')
        port = self.cleaned_data.get('port')
        errors = {}

        if not hostname and not ip:
            errors['hostname'] = 'IP or hostname is required.'
            errors['ip'] = 'IP or hostname is required.'

        if not port:
            errors['port'] = 'Port is required.'

        if errors:
            raise forms.ValidationError(errors)

        return super().clean()