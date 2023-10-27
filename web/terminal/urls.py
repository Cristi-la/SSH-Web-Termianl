from django.urls import path
from  terminal.views import TermianlView

urlpatterns = [
    path('', TermianlView.as_view())
]