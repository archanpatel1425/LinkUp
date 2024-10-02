# myproject/urls.py

from django.contrib import admin
from django.urls import path, include
urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('authentication.urls')),
    path('meeting/', include('meeting.urls')),
    path('user/', include('user.urls')),
]
