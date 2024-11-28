import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../helpers/AuthContext";
const JoinMeeting = () => {
    const [meetingId, setMeetingId] = useState(''); // State for meeting ID
    const { authState } = useContext(AuthContext);
    const navigate = useNavigate();

    function putInWaitingRoom() {
        sessionStorage.setItem('user_details', 'Archan')
        navigate(`/${meetingId}`);
    }
    return (
        <div className='flex flex-col items-center p-5 bg-[#1B1F36]'>
            <div className="space-y-4 w-full max-w-xs">
                <input
                    type="text"
                    placeholder="Enter meeting ID"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)} // Set meeting ID onChange
                    className="w-full p-2 border border-gray-300 rounded"
                />
                <button
                    onClick={putInWaitingRoom}
                    className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Join Room
                </button>
            </div>
        </div>
    );
};

export default JoinMeeting;