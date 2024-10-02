from mongoengine import Document, StringField, EmailField, DateTimeField ,DictField,BooleanField
from datetime import datetime, timezone

class UserProfile(Document):
    
    first_name = StringField(required=True, max_length=100)  # First name is required
    last_name = StringField(required=True, max_length=100)  # Last name is required
    phone_no = StringField(required=True, max_length=15)  # Phone number is required
    email = EmailField(required=True, unique=True)  # Email is required and must be unique
    password = StringField(required=True, max_length=100)  # Password is required
    google_id = StringField(max_length=100, required=False, null=True)  # google_id is optional
    profile_photo = StringField(max_length=255, required=False)  # Image is optional (StringField for image path)
    signedup_at = DateTimeField(default=lambda: datetime.now(timezone.utc))  # Auto timestamp for signup date
    
    # Specify the MongoDB collection
    meta = {"collection": "user_data"}
