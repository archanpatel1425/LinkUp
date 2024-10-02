# myproject/urls.py

from django.contrib import admin
from django.urls import path, include
from authentication import views

urlpatterns = [
    path("signup/", views.signup),
    path('login/',views.login),
    path('validation/', views.extract_data_from_token),
]
