from django.urls import path
from  terminal.views import SSHDetailView, NoteDetailView

urlpatterns = [
    # path('', TermianlView.as_view())
    path('ssh/<int:pk>/', SSHDetailView.as_view(), name='ssh.detail'),
    path('note/<int:pk>/', NoteDetailView.as_view(), name='note.detail'),
]