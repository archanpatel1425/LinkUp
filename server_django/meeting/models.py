from mongoengine import Document, StringField, EmailField, DateTimeField ,DictField,BooleanField
from datetime import datetime, timezone

class Meeting(Document):
    meeting_id = StringField(required=True, unique=True)  # Unique meeting identifier
    host_id = StringField(required=True)  # Reference to the user hosting the meeting
    meeting_link = StringField(required=True)  # Link to the meeting
    controls = DictField(required=True)  # JSON object for various controls
    is_active = BooleanField(default=False)  # Indicates if the meeting is currently active

    meta = {"collection": "meeting_data"}  # Specify the collection name

class WaitingRoom(Document):
    meeting_id = StringField(required=True)  # Unique identifier for the meeting
    user_id = StringField(required=True)  # The ID of the user managing the waiting room (could be host or another user)
    join_at = DateTimeField(default=lambda: datetime.now(timezone.utc))  # Timestamp when the waiting room was created
    
    meta = {"collection": "waiting_room_data"}  # Specify the collection name