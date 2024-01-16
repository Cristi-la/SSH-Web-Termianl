from django.contrib import admin
from django.urls import path, include
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from terminal.views import handler403, handler404, handler500


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('terminal.urls')),
    path('403/', handler403, name='403'),
    path('404/', handler404, name='404'),
    path('500/', handler500, name='500'),
] 


urlpatterns += staticfiles_urlpatterns()


handler403 = 'terminal.views.handler403'
handler404 = 'terminal.views.handler404'
handler500 = 'terminal.views.handler500' 