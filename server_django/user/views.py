from django.http import JsonResponse
from server_django.mongo_connection import get_database
from rest_framework.decorators import api_view
from bson import ObjectId
# Create your views here.

@api_view(["POST"])
def get_user_id_by_email(request):
    email_id = request.data.get("email")
    db = get_database()
    try:
        print(email_id)
        user = db.user_data.find_one({"email": email_id})
        user_id = str(user["_id"])  # Convert ObjectId to string
        return JsonResponse({"user_id": user_id})
    except:
        return JsonResponse({"error": "User not found"}, status=404)
    
@api_view(["POST"])
def get_user_username(request):
    db = get_database()
    user_id = request.data.get("user_id")
    user = db.user_data.find_one({"_id": ObjectId(user_id)})
    username = user["first_name"] + " " + user["last_name"]
    return JsonResponse({"username": username})


@api_view(["POST"])
def fatch_profile_photo(request):
    db = get_database()
    user_id = request.data.get("user_id")
    print(user_id)
    user = db.user_data.find_one({"_id": ObjectId(user_id)})
    print(user["profile_photo"])
    return JsonResponse({"profile_image_url": user["profile_photo"]})


@api_view(["POST"])
def fetch_settings(request):
    db = get_database()
    user_id = request.data.get("user_id")
    meeting_data = db.meeting_data.find_one({"host_id": user_id})
    print(meeting_data["controls"])
    controls = meeting_data["controls"]
    return JsonResponse({"controls": controls})


@api_view(["POST"])
def save_settings(request):
    db = get_database()
    user_id = request.data.get("user_id")
    controls = {
        "allow_participents_screen_share": request.data.get("allowScreenShare"),
        "video_on_join": request.data.get("videoOnJoin"),
        "audio_on_join": request.data.get("audioOnJoin"),
    }
    print(controls)
    db.meeting_data.update_one({"host_id": user_id}, {"$set": {"controls": controls}})
    return JsonResponse({"controls": controls})
