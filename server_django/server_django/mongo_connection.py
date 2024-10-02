from pymongo import MongoClient
from django.conf import settings

def get_mongo_client():
    """Establishes a connection to MongoDB and returns the client object."""
    client = MongoClient(
        host=settings.MONGO_HOST,
        port=settings.MONGO_PORT,
    )
    return client

def get_database():
    """Returns the MongoDB database instance."""
    client = get_mongo_client()
    return client[settings.MONGO_DB_NAME]
