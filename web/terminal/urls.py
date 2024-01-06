from django.urls import path
from  terminal.views import SSHDetailView, NoteDetailView, SSHCreateView, TermianlView, LoginView, LogoutView

urlpatterns = [
    path('terminal/', TermianlView.as_view(), name='terminal'),
    path('ssh/<int:pk>/', SSHDetailView.as_view(), name='ssh.detail'),
    path('ssh/create/', SSHCreateView.as_view(), name='ssh.create'),


    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
]