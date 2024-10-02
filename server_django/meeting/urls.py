# myproject/urls.py

from django.contrib import admin
from django.urls import path, include
from meeting import views

urlpatterns = [
    path('getmeetingid/', views.get_meeting_id),
    path('waiting-room/', views.add_waiting_room_user),
    path('waiting-room-status/', views.check_approvalStatus),
    path('room-updates/', views.room_updates),
    path('admit-user/', views.admit_user),
    path('check_host/', views.check_host),
    path('fetch-meeting-detail/', views.fetch_meeting_detail),
    path('generate-new-meetingId/', views.generate_new_meetingId),
    path('get-control-details/', views.get_controls),
]
