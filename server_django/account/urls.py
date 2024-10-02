# myproject/urls.py

from django.contrib import admin
from django.urls import path, include
from account import views

urlpatterns = [
    path("signup/", views.signup),
    path('login/',views.login),
    # path('getmeetingid/', views.get_meeting_id),
    path('getuserid/', views.get_user_id_by_email),
    path('validation/', views.extract_data_from_token),
    path('getusername/', views.get_user_username),
    # path('waiting-room/', views.add_waiting_room_user),
    # path('waiting-room-status/', views.check_approvalStatus),
    # path('room-updates/', views.room_updates),
    # path('admit-user/', views.admit_user),
    # path('check_host/', views.check_host),
    path('fatch-profile-photo/', views.fatch_profile_photo),
    # path('fetch-meeting-detail/', views.fetch_meeting_detail),
    # path('generate-new-meetingId/', views.generate_new_meetingId),
    path('fetch-settings/', views.fetch_settings),
    path('save-settings/', views.save_settings),
    # path('get-control-details/', views.get_controls),
]
