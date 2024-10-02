import axios from 'axios';
import React, { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from "../helpers/AuthContext";
const WaitingRoom = () => {
    const { authState } = useContext(AuthContext);
    const [isRequestSent, setIsRequestSent] = useState(false)
    const location = useLocation()
    const { meetingId } = location.state
    const navigate = useNavigate();
    var controls = {}
    const get_controls_details = async () => {
        await axios.post(`http://127.0.0.1:8000/meeting/get-control-details/`, { meetingId })
            .then((response) => {
                controls=response.data.controls
                return response.data.controls
            }
            )
    }

    const handleRequestJoin = () => {
        console.log("Joining Room...");
        axios.post(`http://127.0.0.1:8000/user/getusername/`, { user_id: authState.user_id })
            .then((response) => {
                const username = response.data.username
                if (meetingId !== "") {
                    // Add user to waiting room (send to backend)
                    controls = get_controls_details()
                    axios.post(`http://127.0.0.1:8000/meeting/waiting-room/`, {
                        meeting_id: meetingId,
                        user_id: authState.user_id,
                    })
                        .then(() => {
                            // User successfully added to the waiting room
                            setIsRequestSent(true); // Show waiting room status
                            // Start polling the backend for approval
                            checkApprovalStatus(username);
                        })
                        .catch((error) => {
                            alert('Error adding to waiting room.');
                        });
                }
            })
            .catch((error) => {
                alert('Error fetching username.');
            });
    };

    // Function to poll the backend for approval
    const checkApprovalStatus = (username) => {
        const interval = setInterval(() => {
            axios.post(`http://127.0.0.1:8000/meeting/waiting-room-status/`, {
                meeting_id: meetingId,
                user_id: authState.user_id
            })
                .then((response) => {
                    if (response.data.approved) {
                        clearInterval(interval); // Stop polling
                        navigate(`/meet/${meetingId}`, {
                            state: {
                                username: username,
                                allow_participents_screen_share: controls.allow_participents_screen_share,
                                video_on_join: controls.video_on_join,  
                                audio_on_join: controls.audio_on_join
                            } // Pass username in state
                        });
                    }
                })
                .catch((err) => {
                    console.error(err)
                });
        }, 1000); // Poll every second
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
            <div className="bg-[#1B1F36] p-8 rounded-lg shadow-lg w-full max-w-md flex flex-col items-center">
                <h1 className="text-2xl font-bold mb-6 text-white">Waiting Room</h1>
                {/* Ask to Join Button or Loader */}
                {isRequestSent ? (
                    // Show loader when the request is sent
                    <div className="flex items-center justify-center">
                        <svg
                            className="animate-spin h-8 w-8 text-blue-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                        </svg>
                    </div>
                ) : (
                    // Show "Ask to Join" button initially
                    <button
                        onClick={handleRequestJoin}
                        className="w-full py-2 px-4 bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-600 transition duration-300 ease-in-out"
                    >
                        Ask to Join
                    </button>
                )}
            </div>
        </div>
    );
};

export default WaitingRoom;
