from django.shortcuts import render
from django.views.generic import TemplateView
from django.views.generic.detail import DetailView
from terminal.models import SSHData, NotesData

class SSHDetailView(DetailView):
    template_name  = 'terminal.html'
    model = SSHData
    context_object_name = 'sshdata'


class NoteDetailView(DetailView):
    template_name  = 'note.html'
    model = NotesData
    context_object_name = 'notedata'


