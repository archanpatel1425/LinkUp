from mongoengine import Document, StringField, EmailField, ImageField


class UserProfile(Document):
    name = StringField(required=True, max_length=100)
    number = StringField(required=True, max_length=15)
    email = EmailField(required=True, unique=True)
    password = StringField(required=True, max_length=100)
    image = StringField()  # You can also use ImageField if you have image storage
    meta = {"collection": "user_profiles"}  # The MongoDB collection name
    