from django import forms

class SSHDataForm(forms.Form):
    name = forms.CharField(max_length=100, required=False, initial='Session')
    username = forms.CharField(max_length=100, required=False)
    password = forms.CharField(widget=forms.PasswordInput, required=False)
    private_key = forms.CharField(widget=forms.Textarea, required=False)
    passphrase = forms.CharField(widget=forms.PasswordInput, required=False)
    ip = forms.GenericIPAddressField()

    def clean_ip(self):
        ip = self.cleaned_data['ip']
        if not ip:
            raise forms.ValidationError('IP is required.')
        # Add additional IP validation if needed
        return ip