from django.urls import path
from  terminal.views import SSHDetailView, NoteDetailView, SSHCreateView, TermianlView

urlpatterns = [
    path('terminal/', TermianlView.as_view()),
    path('ssh/<int:pk>/', SSHDetailView.as_view(), name='ssh.detail'),
    path('ssh/create/', SSHCreateView.as_view(), name='ssh.create'),

    # path('note/<int:pk>/', NoteCreateView.as_view(), name='note.detail'),
]