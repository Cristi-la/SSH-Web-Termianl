from django.urls import path
from terminal.views import SSHDetailView, NoteDetailView
from .views import TermianlView

urlpatterns = [
    path('terminal/', TermianlView.as_view()),
    path('ssh/<int:pk>/', SSHDetailView.as_view(), name='ssh.detail'),
    path('note/<int:pk>/', NoteDetailView.as_view(), name='note.detail'),
]