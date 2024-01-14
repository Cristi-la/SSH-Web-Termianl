from django.urls import path
from  terminal.views import (
    SSHDetailView, NoteDetailView, SSHCreateView,
    TermianlView, LoginView, LogoutView,
    TerminalCreatView, NoteCreateView, TerminalJoinView
)

urlpatterns = [
    path('create/', TerminalCreatView.as_view(), name='create'),
    path('terminal/', TermianlView.as_view(), name='terminal'),
    path('terminal/join/<str:session_key>/', TerminalJoinView.as_view(), name='terminal.join'),
    path('', TermianlView.as_view(), name='terminal'),

    path('ssh/<int:pk>/', SSHDetailView.as_view(), name='ssh.detail'),
    path('ssh/create/', SSHCreateView.as_view(), name='ssh.create'),
    path('note/<int:pk>/', NoteDetailView.as_view(), name='note.detail'),
    path('note/create/', NoteCreateView.as_view(), name='note.create'),


    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
]