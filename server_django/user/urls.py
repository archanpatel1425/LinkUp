# myproject/urls.py

from django.contrib import admin
from django.urls import path, include
from user import views

urlpatterns = [
    path('getuserid/', views.get_user_id_by_email),
    path('getusername/', views.get_user_username),
    path('fatch-profile-photo/', views.fatch_profile_photo),
    path('fetch-settings/', views.fetch_settings),
    path('save-settings/', views.save_settings),
]
