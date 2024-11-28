import { Camera, Clock, LogOut, MessageSquare, Mic, MonitorUp, UserPlus, Users, X } from 'lucide-react';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import { MdScreenShare } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { AuthContext } from "../helpers/AuthContext";

const VideoChat = () => {
    const navigate = useNavigate();
    const localVideoRef = useRef(null);
    const [peers, setPeers] = useState({});
    const peerConnections = useRef({});
    const localStream = useRef(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const dataChannels = useRef({});
    const screenStream = useRef(null);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [participants, setParticipants] = useState([]);
    const { roomId } = useParams()
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [waitingUsers, setWaitingUsers] = useState([]);
    const [isHost, setIsHost] = useState(true);
    const [showWaitingRoom, setShowWaitingRoom] = useState(false);
    const socketRef = useRef(null);
    const { authState } = useContext(AuthContext);
    const [username, setUsername] = useState(authState.username)
    const [userId, setUserId] = useState(authState.user_id)
    const config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    }

    useEffect(() => {
        if (!localStorage.getItem('jwt_token')) {
            console.log('heloo uu')
            navigate("/")
            return
        }
        if (!sessionStorage.getItem('meeting_id')) {
            const currentUrl = window.location.href;
            const meetingId = currentUrl.split('/').pop();
            navigate(`/${meetingId}`);

            return
        }
        socketRef.current = io('http://localhost:5000');
        startStream();
        // Set up socket event listeners

        socketRef.current.on('room-users', (usersInRoom) => {
            console.log('Received room users:', usersInRoom);
            const { participants, waitingUsers } = usersInRoom;

            // Convert participants object to array
            const participantsArray = Object.entries(participants).map(([socketId, user]) => ({
                socketId,
                username: user.username,
                userId: user.userId,
                videoOn: user.videoOn,
                audioOn: user.audioOn,
                screenShareOn: user.screenShareOn
            }));

            // Convert waiting users object to array
            const waitingUsersArray = Object.entries(waitingUsers).map(([socketId, user]) => ({
                socketId,
                username: user.username,
                userId: user.userId,
                videoOn: user.videoOn,
                audioOn: user.audioOn,
                screenShareOn: user.screenShareOn
            }));

            setParticipants(participantsArray);
            setWaitingUsers(waitingUsersArray);
        });
        socketRef.current.on('user-joined', handleUserJoined);
        socketRef.current.on('offer', handleOffer);
        socketRef.current.on('answer', handleAnswer);
        socketRef.current.on('ice-candidate', handleIceCandidate);
        socketRef.current.on('user-disconnected', handleUserDisconnected);

        return () => {
            leaveMeeting();
            // Clean up socket listeners
            socketRef.current.off('room-users');
            socketRef.current.off('user-joined');
            socketRef.current.off('offer');
            socketRef.current.off('answer');
            socketRef.current.off('ice-candidate');
            socketRef.current.off('user-disconnected');
        };
    }, [roomId]);

    // 2. Modify startStream to only handle media and emit join-room
    const startStream = async () => {
        try {
            localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideoRef.current.srcObject = localStream.current;
            console.log("----here")
            socketRef.current.emit('join-room', roomId, username, userId);
        } catch (error) {
            console.error('Error accessing media devices', error);
        }
    };

    const setupDataChannel = (channel, userId) => {
        channel.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages(prevMessages => [...prevMessages, { username, content: message.content }]);
        };
        dataChannels.current[userId] = channel;
    };

    const handleUserJoined = async (userId) => {
        console.log('User joined room:', userId);
        const peerConnection = createPeerConnection(userId);
        const dataChannel = peerConnection.createDataChannel('chat');
        setupDataChannel(dataChannel, userId);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socketRef.current.emit('offer', offer, userId);
    };

    const handleOffer = async (offer, userId) => {
        const peerConnection = createPeerConnection(userId);
        peerConnection.ondatachannel = (event) => {
            setupDataChannel(event.channel, userId);
        };
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socketRef.current.emit('answer', answer, userId);
    };

    const handleAnswer = async (answer, userId) => {
        const peerConnection = peerConnections.current[userId];
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = (candidate, userId) => {
        const peerConnection = peerConnections.current[userId];
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleUserDisconnected = (userId) => {
        console.log(`User disconnected: ${userId}`);
        console.log(participants)
        if (peerConnections.current[userId]) {
            peerConnections.current[userId].close();
            delete peerConnections.current[userId];
        }
        setPeers(prevPeers => {
            const newPeers = { ...prevPeers };
            delete newPeers[userId];
            return newPeers;
        });
        setParticipants(prevParticipants =>
            prevParticipants.filter(participant => participant.id !== userId)
        );
        removeRemoteStream(userId);
    };

    const createPeerConnection = (userId) => {
        const peerConnection = new RTCPeerConnection(config);

        localStream.current.getTracks().forEach((track) => peerConnection.addTrack(track, localStream.current));

        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            addRemoteStream(remoteStream, userId);
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('ice-candidate', event.candidate, userId);
            }
        };

        peerConnections.current[userId] = peerConnection;
        return peerConnection;
    };

    const addRemoteStream = (stream, userId) => {
        let videoElement = document.getElementById(`remote-video-${userId}`);
        if (!videoElement) {
            videoElement = document.createElement('video');
            videoElement.id = `remote-video-${userId}`;
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            videoElement.className = "w-80 h-60 rounded-lg shadow-md mb-4";
            document.getElementById('remote-videos').appendChild(videoElement);
        }
        videoElement.srcObject = stream;
    };

    const removeRemoteStream = (userId) => {
        const videoElement = document.getElementById(`remote-video-${userId}`);
        if (videoElement) videoElement.remove();
    };


    const toggleMic = () => {
        const audioTrack = localStream.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setMicOn(audioTrack.enabled);
            socketRef.current.emit('toggle-audio', roomId, audioTrack.enabled);
        }
    };

    const toggleVideo = () => {
        const videoTrack = localStream.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setVideoOn(videoTrack.enabled);
            socketRef.current.emit('toggle-video', roomId, videoTrack.enabled);
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                screenStream.current = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.current.getVideoTracks()[0];

                Object.values(peerConnections.current).forEach((pc) => {
                    const sender = pc.getSenders().find(s => s.track.kind === 'video');
                    sender.replaceTrack(screenTrack);
                });

                screenTrack.onended = () => {
                    stopScreenShare();
                };

                localVideoRef.current.srcObject = screenStream.current;
                setIsScreenSharing(true);
                socketRef.current.emit('toggle-screen-share', roomId, true);
            } catch (error) {
                console.error('Error sharing screen:', error);
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = () => {
        if (screenStream.current) {
            screenStream.current.getTracks().forEach(track => track.stop());
            screenStream.current = null;
        }

        const videoTrack = localStream.current.getVideoTracks()[0];

        Object.values(peerConnections.current).forEach((pc) => {
            const sender = pc.getSenders().find(s => s.track.kind === 'video');
            sender.replaceTrack(videoTrack);
        });

        localVideoRef.current.srcObject = localStream.current;
        setIsScreenSharing(false);
        socketRef.current.emit('toggle-screen-share', roomId, false);
    };


    const sendMessage = () => {
        if (inputMessage.trim()) {
            const message = { content: inputMessage.trim() };
            setMessages(prevMessages => [...prevMessages, { username: 'You', content: message.content }]);
            Object.values(dataChannels.current).forEach(channel => {
                channel.send(JSON.stringify(message));
            });
            setInputMessage('');
        }
    };

    const leaveMeeting = () => {
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }

        // Clean up peer connections
        Object.values(peerConnections.current).forEach(pc => pc.close());
        peerConnections.current = {};
        socketRef.current.emit('leave-room', roomId);

        // Disconnect the socket and create a new connection
        socketRef.current.disconnect();

        // Navigate to dashboard
        navigate('/dashboard');
    };
    const toggleWaitingRoom = () => {
        setShowWaitingRoom(!showWaitingRoom);
        setShowChat(false);
        setShowParticipants(false);

    };

    const toggleParticipants = () => {
        setShowParticipants(!showParticipants);
        setShowChat(false);
        setShowWaitingRoom(false);

    };

    const toggleChat = () => {
        setShowChat(!showChat);
        setShowParticipants(false);
        setShowWaitingRoom(false);
    };
    const admitUser = (userSocketId) => {
        socketRef.current.emit('admit-user', roomId, userSocketId);
    }
    return (
        <div className="flex flex-col h-screen w-full bg-gray-900 text-white">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 py-2">
                <div className="flex items-center space-x-2">
                    <div className="text-blue-500 w-8 h-8">
                        <Camera className="w-full h-full m-1" />
                    </div>
                    <span className="text-3xl font-semibold p-2">VideoChat</span>
                </div>
                {isHost && (
                    <button
                        onClick={toggleWaitingRoom}
                        className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
                    >
                        <Clock size={24} />
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="w-full h-full max-w-8xl max-h-6xl bg-[#1B1F36] rounded-lg p-4 flex flex-col items-center">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-80 h-60 rounded-lg shadow-md mb-4 fixed bottom-20 right-8"
                    />

                    <div className="overflow-x-auto">
                        <div id="remote-videos" className="flex justify-center flex-wrap gap-4">
                            {/* Remote videos will be appended here */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Controls */}
            <div className="h-16 flex items-center justify-center w-full px-4 bg-gray-900">
                <div className="flex justify-center items-center space-x-4">
                    <button
                        onClick={toggleVideo}
                        className={`p-3 rounded-full ${videoOn ? 'bg-blue-600' : 'bg-red-600'} hover:opacity-90 transition-colors`}
                    >
                        <Camera size={24} />
                    </button>
                    <button
                        onClick={toggleMic}
                        className={`p-3 rounded-full ${micOn ? 'bg-blue-600' : 'bg-red-600'} hover:opacity-90 transition-colors`}
                    >
                        <Mic size={24} />
                    </button>
                    <button
                        onClick={toggleScreenShare}
                        className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-700'} hover:opacity-90 transition-colors`}
                    >
                        <MonitorUp size={24} />
                    </button>
                    <button
                        onClick={toggleParticipants}
                        className="p-3 rounded-full bg-gray-700 hover:opacity-90 transition-colors"
                    >
                        <Users size={24} />
                    </button>
                    <button
                        onClick={toggleChat}
                        className="p-3 rounded-full bg-gray-700 hover:opacity-90 transition-colors"
                    >
                        <MessageSquare size={24} />
                    </button>
                    <button
                        onClick={leaveMeeting}
                        className="p-3 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                    >
                        <LogOut size={24} />
                    </button>
                </div>
            </div>

            {/* Participants List */}
            <div className={`fixed top-0 right-0 h-full w-80 bg-gray-800 p-4 transform transition-transform duration-300 ease-in-out ${showParticipants ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Participants</h2>
                    <button onClick={toggleParticipants} className="p-1 hover:bg-gray-700 rounded-full">
                        <X size={24} />
                    </button>
                </div>
                <ul className="space-y-2">
                    {participants.map((participant) => (
                        <li key={participant.socketId} className="p-2 bg-gray-900 rounded-md shadow-md flex items-center justify-between">
                            {/* Username */}
                            <span className="font-medium">{participant.username}</span>

                            {/* Icons Wrapper */}
                            <div className="flex items-center space-x-2">
                                {/* Screen Share Icon */}
                                {participant.screenShareOn && (
                                    <MdScreenShare className="text-blue-500" title="Screen Sharing On" size={20} />
                                )}
                                {/* Audio Icons */}
                                {participant.audioOn ? (
                                    <FaMicrophone className="text-green-500" title="Audio On" size={20} />
                                ) : (
                                    <FaMicrophoneSlash className="text-red-500" title="Audio Off" size={20} />
                                )}

                                {/* Video Icons */}
                                {participant.videoOn ? (
                                    <FaVideo className="text-green-500" title="Video On" size={20} />
                                ) : (
                                    <FaVideoSlash className="text-red-500" title="Video Off" size={20} />
                                )}

                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Chat */}
            <div className={`fixed top-0 right-0 h-full w-80 bg-gray-800 p-4 transform transition-transform duration-300 ease-in-out ${showChat ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Chat</h2>
                    <button onClick={toggleChat} className="p-1 hover:bg-gray-700 rounded-full">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex flex-col h-[calc(100%-8rem)]">
                    <div className="flex-grow overflow-y-auto mb-4">
                        {messages.map((msg, index) => (
                            <div key={index} className="mb-2">
                                <p><strong>{msg.username}:</strong> {msg.content}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            className="flex-grow p-2 bg-gray-700 rounded-l text-white"
                            placeholder="Type a message..."
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button onClick={sendMessage} className="bg-blue-600 p-2 rounded-r">Send</button>
                    </div>
                </div>
            </div>

            {/* Waiting Room */}
            {isHost && (
                <div className={`fixed top-0 right-0 h-full w-80 bg-gray-800 p-4 transform transition-transform duration-300 ease-in-out ${showWaitingRoom ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Waiting Room</h2>
                        <button onClick={toggleWaitingRoom} className="p-1 hover:bg-gray-700 rounded-full">
                            <X size={24} />
                        </button>
                    </div>
                    <ul className="space-y-2">
                        {waitingUsers.map((user) => (
                            <li key={user.socketId} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                                <span>{user.username}</span>
                                <button
                                    onClick={() => admitUser(user.socketId)}
                                    className="bg-green-600 p-1 rounded hover:bg-green-700"
                                >
                                    <UserPlus size={20} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default VideoChat;