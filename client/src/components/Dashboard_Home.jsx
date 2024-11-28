import { PlusCircle, Video } from 'lucide-react'; // Assuming you're using Lucide icons
import React, { useContext, useEffect, useState } from 'react';

import axios from 'axios';
import { IoMdClose } from 'react-icons/io';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../helpers/AuthContext";
import Home1 from '../images/Home1.png';
import JoinMeeting from '../pages/JoinMeeitng';
import { useToast } from './Toast';
const Dashboard_Home = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const navigate = useNavigate();
    const { authState } = useContext(AuthContext);
    const { showToast } = useToast();

    Modal.setAppElement('#root');

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const formatDate = (date) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = formatDate(currentTime);

    const handleJoinMeeting = () => {
        setIsJoinModalOpen(true);
    };

    const closeModal = () => {
        setIsJoinModalOpen(false);
    };

    const handleStartMeeting = () => {
        const user_id = authState.user_id;
        axios.post('http://localhost:5000/meeting/getmeetingid/', { user_id })
            .then((response) => {
                const meetingId = response.data.meeting_id;
                axios.post('http://localhost:5000/user/getusername/', { user_id: authState.user_id })
                    .then(async (response) => {
                        if (meetingId !== "") {
                            sessionStorage.setItem('meeting_id', btoa(meetingId))
                            await axios.post('http://localhost:5000/user/fetch-settings/', { meetingId })
                                .then((res) => {
                                    const { allow_participants_screen_share, enableWaitingRoom } = res.data.controls
                                    navigate(`/meet/${meetingId}`, {
                                        state: {
                                            allow_participants_screen_share, enableWaitingRoom, micOn: true,
                                            videoOn: true
                                        }
                                    })
                                })
                        }
                    })
            })
            .catch((error) => {
                console.error("Error fetching meeting ID:", error);
            });
    };

    return (
        <>
            <div
                className="bg-gray-700 p-6 rounded-lg mb-6 flex flex-col justify-center items-start bg-cover bg-center h-[47vh] w-full"
                style={{ backgroundImage: `url(${Home1})` }}
            >
                <p className="text-6xl font-bold mt-2 text-left">{formattedTime}</p>
                <p className="text-3xl mt-1 text-left">{formattedDate}</p>
            </div>

            <div className="pt-6 bg-gray-900 min-h-screen">

                {/* Meeting Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                    <div
                        className="bg-orange-500 p-6 rounded-lg text-center shadow-lg cursor-pointer hover:bg-orange-600 transition flex flex-col items-center"
                        onClick={handleStartMeeting}
                        style={{ height: '180px' }} // Uniform height
                    >
                        <PlusCircle className="text-white mb-2" size={40} />
                        <h3 className="text-2xl font-semibold text-white">New Meeting</h3>
                        <p className="mt-2 text-white">Setup a new recording</p>
                    </div>

                    <div
                        className="bg-blue-500 p-6 rounded-lg text-center shadow-lg cursor-pointer hover:bg-blue-600 transition flex flex-col items-center"
                        onClick={handleJoinMeeting}
                        style={{ height: '180px' }} // Uniform height
                    >
                        <Video className="text-white mb-2" size={40} />
                        <h3 className="text-2xl font-semibold text-white">Join Meeting</h3>
                        <p className="mt-2 text-white">Via invitation link</p>
                    </div>

                    {/* <div
                            className="bg-purple-500 p-6 rounded-lg text-center shadow-lg cursor-pointer hover:bg-purple-600 transition flex flex-col items-center"
                            style={{ height: '180px' }} // Uniform height
                        >
                            <Calendar className="text-white mb-2" size={40} />
                            <h3 className="text-2xl font-semibold text-white">Schedule Meeting</h3>
                            <p className="mt-2 text-white">Plan your meeting</p>
                        </div>

                        <div
                            className="bg-yellow-500 p-6 rounded-lg text-center shadow-lg cursor-pointer hover:bg-yellow-600 transition flex flex-col items-center"
                            style={{ height: '180px' }} // Uniform height
                        >
                            <Play className="text-white mb-2" size={40} />
                            <h3 className="text-2xl font-semibold text-white">View Recordings</h3>
                            <p className="mt-2 text-white">Meeting recordings</p>
                        </div> */}
                </div>
            </div>

            <Modal
                isOpen={isJoinModalOpen}
                onRequestClose={closeModal}
                contentLabel="Enter Meeting ID"
                className="fixed inset-0 flex items-center justify-center z-50"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40"
            >
                <div className="relative bg-[#1B1F36] rounded-lg shadow-lg p-6 w-full max-w-md">
                    <button
                        onClick={closeModal}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 hover:shadow-lg transition duration-200"
                    >
                        <IoMdClose size={20} />
                    </button>
                    <h2 className="text-white text-3xl font-bold mb-4 text-center">Join Meeting</h2>
                    <JoinMeeting closeModal={closeModal} />
                </div>
            </Modal>
        </>
    );
};

export default Dashboard_Home;