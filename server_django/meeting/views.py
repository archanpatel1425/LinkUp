from django.http import JsonResponse
from server_django.mongo_connection import get_database
from rest_framework.response import Response
from rest_framework.decorators import api_view
from bson import ObjectId
import uuid

# Create your views here.
@api_view(["POST"])
def get_meeting_id(request):
    user_id = request.data.get("user_id")
    db = get_database()
    try:
        # Fetch the meeting based on the host_id (or modify based on your logic)
        meeting = db.meeting_data.find_one({"host_id": user_id})
        if meeting:
            return JsonResponse({"meeting_id": meeting["meeting_id"]}, status=200)
        else:
            return JsonResponse(
                {"error": "No meeting found for this user."}, status=404
            )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["POST"])
def add_waiting_room_user(request):
    db = get_database()
    meeting_id = request.data.get("meeting_id")
    user_id = request.data.get("user_id")
    db.waiting_room_data.insert_one({"meeting_id": meeting_id, "user_id": user_id})
    return Response({"message": "User added to waiting room successfully"}, status=201)


@api_view(["POST"])
def check_approvalStatus(request):
    db = get_database()
    meeting_id = request.data.get("meeting_id")
    user_id = request.data.get("user_id")
    user = db.waiting_room_data.find_one({"meeting_id": meeting_id, "user_id": user_id})
    if user:
        return Response({"approved": False}, status=201)
    else:
        return Response({"approved": True}, status=201)


@api_view(["POST"])
def room_updates(request):
    db = get_database()
    meeting_id = request.data.get("meeting_id")
    user_ids = db.waiting_room_data.find(
        {"meeting_id": meeting_id}, {"_id": 0, "user_id": 1}
    )
    user_ids = [ObjectId(user["user_id"]) for user in user_ids]
    users = db.user_data.find(
        {"_id": {"$in": user_ids}}, {"_id": 1, "first_name": 1, "last_name": 1}
    )
    result = [
        {
            "user_id": str(user["_id"]),
            "username": user["first_name"] + " " + user["last_name"],
        }
        for user in users
    ]
    return JsonResponse({"waiting_room_list": result})


@api_view(["POST"])
def admit_user(request):
    db = get_database()
    meeting_id = request.data.get("room")
    user_id = request.data.get("userId")
    db.waiting_room_data.delete_one({"meeting_id": meeting_id, "user_id": user_id})
    return Response(status=201)


@api_view(["POST"])
def check_host(request):
    db = get_database()
    meeting_id = request.data.get("room")
    user_id = request.data.get("user_id")
    user = db.meeting_data.find_one({"meeting_id": meeting_id, "host_id": user_id})
    if user:
        return JsonResponse({"is_host": True})
    else:
        return JsonResponse({"is_host": False})


@api_view(["POST"])
def fetch_meeting_detail(request):
    db = get_database()
    user_id = request.data.get("user_id")
    print(user_id)
    meeting_data = db.meeting_data.find_one({"host_id": user_id})
    user_data = db.user_data.find_one({"_id": ObjectId(user_id)})
    username = user_data["first_name"] + " " + user_data["last_name"]
    print(meeting_data)
    meeting_id = meeting_data["meeting_id"]
    meeting_link = meeting_data["meeting_link"]
    return JsonResponse(
        {"username": username, "meeting_id": meeting_id, "meeting_link": meeting_link}
    )

def generate_meeting_id():
    db = get_database()
    # Generate a random UUID and get the first 12 alphanumeric characters
    meeting_id = str(uuid.uuid4()).replace("-", "")[:12]
    formatted_meeting_id = f"{meeting_id[:4]}-{meeting_id[4:8]}-{meeting_id[8:]}"
    result = db.meeting_data.find_one({"meeting_id": str(formatted_meeting_id)})
    if result:
        generate_meeting_id()
    else:
        return formatted_meeting_id

@api_view(["POST"])
def generate_new_meetingId(request):
    db = get_database()
    user_id = request.data.get("user_id")
    new_meeting_id = generate_meeting_id()
    db.meeting_data.update_one(
        {"host_id": user_id},
        {
            "$set": {
                "meeting_id": new_meeting_id,
                "meeting_link": f"http://localhost:5173/meet/{new_meeting_id}",
            }
        },
    )
    return JsonResponse(
        {
            "meeting_id": new_meeting_id,
        }
    )


@api_view(["POST"])
def get_controls(request):
    db = get_database()
    meeting_id = request.data.get("meetingId")
    print(meeting_id)
    meeting_data = db.meeting_data.find_one({"meeting_id": meeting_id})
    print(meeting_data)
    controls = meeting_data["controls"]
    return JsonResponse({"controls": controls})
