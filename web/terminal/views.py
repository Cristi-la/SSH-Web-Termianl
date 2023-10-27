from django.shortcuts import render
from django.views.generic import TemplateView


class TermianlView(TemplateView):
    template_name  = 'terminal.html'

