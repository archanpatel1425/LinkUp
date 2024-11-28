import axios from 'axios';
import { Camera, CameraOff, Loader2, Mic, MicOff } from 'lucide-react';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { AuthContext } from "../helpers/AuthContext";

const WaitingRoom = () => {
    const { authState } = useContext(AuthContext);
    const [isRequestSent, setIsRequestSent] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(false);
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const socketRef = useRef(null);
    const videoRef = useRef(null);
    const user_id = authState.user_id;
    const [isLoading, setIsLoading] = React.useState(false);
    useEffect(() => {
        checkMeetingId(meetingId)
    }, [])

    useEffect(() => {
        socketRef.current = io('http://localhost:5000');
        socketRef.current.on('admitted-to-room', async (userData) => {
            console.log('admited')
            console.log(userData)
            setIsLoading(false);
            sessionStorage.setItem('meeting_id', btoa(meetingId));
            await axios.post('http://localhost:5000/user/fetch-settings/', { meetingId })
                .then((res) => {
                    const { allow_participants_screen_share, enableWaitingRoom } = res.data.controls;
                    console.log(allow_participants_screen_share,
                        enableWaitingRoom,
                        micOn,
                        videoOn)
                    sessionStorage.setItem('meeting_id', btoa(meetingId));
                    navigate(`/meet/${meetingId}`, {
                        state: {
                            allow_participants_screen_share,
                            enableWaitingRoom,
                            micOn: userData.audioOn,
                            videoOn: userData.videoOn,
                        }
                    });
                });
        });
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const checkMeetingId = (meetingId) => {
        const regex = /^([a-z0-9]{4}\-){2}[a-z0-9]{4}$/;
        const isValidPattern = regex.test(meetingId);
        if (isValidPattern) {
            axios.post('http://localhost:5000/meeting/validate-meeting-id/', { meetingId })
                .then((response) => {
                    if (response.data.validMeetingId === false) {
                        console.log('Wrong meeting ID');
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        } else {
            console.log('Invalid pattern of meeting ID');
            navigate('/');
        }
    };


    const handleJoin = async () => {
        await axios.post('http://localhost:5000/user/fetch-settings/', { meetingId })
            .then((res) => {
                const { allow_participants_screen_share, enableWaitingRoom } = res.data.controls;
                if (enableWaitingRoom) {
                    setIsRequestSent(true);
                    setIsLoading(true);
                    socketRef.current.emit('join-waiting-room', meetingId, 'Archan', 'Archan1234', { videoOn, micOn });
                } else {
                    sessionStorage.setItem('meeting_id', btoa(meetingId));
                    console.log(allow_participants_screen_share,
                        enableWaitingRoom,
                        micOn,
                        videoOn)
                    navigate(`/meet/${meetingId}`, {
                        state: {
                            allow_participants_screen_share,
                            enableWaitingRoom,
                            micOn,
                            videoOn
                        }
                    });
                }
            });
    };

    const toggleMic = () => {
        setMicOn(prev => !prev);
    };

    const toggleVideo = () => {
        setVideoOn(prev => !prev);
        if (!videoOn) {
            // Turn on video
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    videoRef.current.srcObject = stream;
                })
                .catch(error => console.error('Error accessing video stream:', error));
        } else {
            // Turn off video
            let tracks = videoRef.current.srcObject?.getTracks();
            tracks?.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    return (
        <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-7xl">
                <div className="bg-[#1B1F36] rounded-xl shadow-2xl overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-8 p-6 md:p-12">
                        {/* Video Preview Section */}
                        <div className="flex flex-col items-center justify-center space-y-6">
                            {videoOn ? (
                                <div className="relative w-full aspect-video max-w-lg bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Controls positioned at the left corner */}
                                    <div className="absolute bottom-4 right-4 flex space-x-4">
                                        <button
                                            onClick={toggleMic}
                                            className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${micOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                                            aria-label={micOn ? 'Turn off microphone' : 'Turn on microphone'}
                                        >
                                            {micOn ? (
                                                <Mic className="text-white w-5 h-5" />
                                            ) : (
                                                <MicOff className="text-white w-5 h-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={toggleVideo}
                                            className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${videoOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                                            aria-label={videoOn ? 'Turn off camera' : 'Turn on camera'}
                                        >
                                            {videoOn ? (
                                                <Camera className="text-white w-5 h-5" />
                                            ) : (
                                                <CameraOff className="text-white w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-full aspect-video max-w-lg bg-gray-800 rounded-xl flex items-center justify-center">
                                    <CameraOff size={48} className="text-gray-500" />
                                    {/* Controls positioned at the left corner */}
                                    <div className="absolute bottom-4 right-4 flex space-x-4">
                                        <button
                                            onClick={toggleMic}
                                            className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${micOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                                            aria-label={micOn ? 'Turn off microphone' : 'Turn on microphone'}
                                        >
                                            {micOn ? (
                                                <Mic className="text-white w-5 h-5" />
                                            ) : (
                                                <MicOff className="text-white w-5 h-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={toggleVideo}
                                            className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${videoOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                                            aria-label={videoOn ? 'Turn off camera' : 'Turn on camera'}
                                        >
                                            {videoOn ? (
                                                <Camera className="text-white w-5 h-5" />
                                            ) : (
                                                <CameraOff className="text-white w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Join Controls Section */}
                        <div className="flex flex-col items-center justify-center space-y-8">
                            <div className="text-center space-y-4">
                                <h1 className="text-3xl font-bold text-white">Ready to join?</h1>
                                <p className="text-gray-400">
                                    Joining as <span className="font-semibold text-white">{authState.username || 'Guest'}</span>
                                </p>
                            </div>

                            {isRequestSent ? (
                                <div className="text-center space-y-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                                    <p className="text-gray-300">Waiting for host to admit you...</p>
                                </div>
                            ) : (
                                <button
                                    onClick={handleJoin}
                                    disabled={isLoading}
                                    className="relative w-full max-w-md py-3 px-6 bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-600 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="opacity-0">Join Meeting</span>
                                            <Loader2 className="w-5 h-5 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                        </>
                                    ) : (
                                        'Join Meeting'
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default WaitingRoom;
