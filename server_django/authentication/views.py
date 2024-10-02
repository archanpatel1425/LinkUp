from django.http import JsonResponse
from server_django.mongo_connection import get_database
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
import bcrypt
import jwt
import datetime
import random
import uuid 
color_array = [
    "1abc9c",
    "2ecc71",
    "3498db",
    "9b59b6",
    "f39c12",
    "e74c3c",
    "e67e22",
    "34495e",
    "16a085",
    "27ae60",
    "2980b9",
    "8e44ad",
    "c0392b",
    "d35400",
    "7f8c8d",
]

@api_view(["POST"])
def signup(request):
    db = get_database()
    user_data = request.data.dict()  # Convert QueryDict to a simple dictionary
    first_name = user_data["first_name"]
    last_name = user_data["last_name"]
    # Debugging statements
    user_exist = db.user_data.find_one({"email": user_data["email"]})
    if user_exist:
        return Response({"error": "User already registered"})
    # Ensure password is a string
    if isinstance(user_data.get("password"), list):
        user_data["password"] = user_data["password"][0]
    # Validate fields
    if "password" not in user_data or not isinstance(user_data["password"], str):
        return Response({"error": "Password must be a string"})
    # Hash password if not using Google login (no google_id)
    if "google_id" not in user_data:
        user_data["password"] = bcrypt.hashpw(
            user_data["password"].encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")
    random_color = random.choice(color_array)
    profile_photo = f"https://ui-avatars.com/api/?name={first_name}+{last_name}&background={random_color}&color=fff&size=500&font-size=0.55&uppercase=true"
    user_data["profile_photo"] = profile_photo
    try:
        result = db.user_data.insert_one(user_data)  # Insert into MongoDB
        user_id = str(result.inserted_id)  # Convert ObjectId to string
        asign_meeting_id(user_id)
        token = generate_jwt(user_id, user_data["email"])
        return Response(
            {
                "message": "User registered successfully",
                "token": token,  # Include token in response
                "user_id": user_id,
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Login Function remains the same
@api_view(["POST"])
def login(request):
    db = get_database()
    print()
    email = request.data.get("email")
    password = request.data.get("password")

    user = db.user_data.find_one({"email": email})
    print("user : ", user)
    if not user:
        return Response({"error": "User not found"})

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
        return Response({"error": "Incorrect password"})

    user_id = str(user["_id"])  # Get the user's _id
    token = generate_jwt(user_id, email)
    return Response(
        {
            "message": "Login successful",
            "token": token,  # Include token in response
        },
        status=status.HTTP_200_OK,
    )


def generate_jwt(user_id, email):
    SECRET_KEY = "importantsecret"
    # Set expiration time to 7 days
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    # Generate the JWT token
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token
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



def asign_meeting_id(user_id):
    db = get_database()
    meeting_data = {}
    meeting_data["meeting_id"] = generate_meeting_id()
    meeting_data["host_id"] = user_id
    meeting_data["meeting_link"] = (
        "http://localhost:5173/meet/" + meeting_data["meeting_id"]
    )
    meeting_data["is_active"] = False
    meeting_data["controls"] = {
        "allow_participents_screen_share": False,
        "video_on_join": True,
        "audio_on_join": True,
    }
    db.meeting_data.insert_one(meeting_data)  # Insert into MongoDB

@api_view(["POST"])
def extract_data_from_token(request):
    token = request.data.get("accessToken")
    secret_key = "importantsecret"
    decoded_data = jwt.decode(
        token, secret_key, algorithms=["HS256"]
    )  # Use the algorithm that was used to encode the token
    return JsonResponse(decoded_data)
