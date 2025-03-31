import axios from 'axios';
import { Camera, Clock, LogOut, MessageSquare, Mic, MonitorUp, UserPlus, Users, X } from 'lucide-react';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import { MdScreenShare } from 'react-icons/md';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { useToast } from '../components/Toast'; // Ad
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
    const [isHost, setIsHost] = useState(false);
    const [showWaitingRoom, setShowWaitingRoom] = useState(false);
    const socketRef = useRef(null);
    const { authState } = useContext(AuthContext);
    const [username, setUsername] = useState(authState.username)
    const [userId, setUserId] = useState(authState.user_id)
    const [allow_participants_screen_share, setAllow_participants_screen_share] = useState(false)
    const [enableWaitingRoom, setEnableWaitingRoom] = useState(false)
    const sidebarRef = useRef(null);
    const location = useLocation()
    const { showToast } = useToast();
    const [socketId, setSocketId] = useState('')

    const config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    }

    useEffect(() => {
        if (!localStorage.getItem('jwt_token')) {
            navigate("/")
            return
        }
        if (!sessionStorage.getItem('meeting_id')) {
            navigate("/")
            return
        }
        setAllow_participants_screen_share(location.state.allow_participants_screen_share)
        setEnableWaitingRoom(location.state.enableWaitingRoom)
        // setVideoOn(location.state.videoOn)
        // setMicOn(location.state.micOn)
        check_is_host()
        socketRef.current = io('http://localhost:5000');
        startStream();
        // Set up socket event listeners

        socketRef.current.on('room-users', (usersInRoom) => {
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
            socketRef.current.off('update-socketId');
        };
    }, [roomId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                // Check if the click is not on the toggle buttons
                const isToggleButton = event.target.closest('[data-toggle-button="true"]');
                if (!isToggleButton) {
                    setShowWaitingRoom(false);
                    setShowChat(false);
                    // setShowParticipants(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        socketRef.current.on('update-socketId', (socketId) => {
            setSocketId(socketId)
        });
        return () => {
            socketRef.current.off('update-socketId');
        }
    }, [socketId])

    const check_is_host = () => {
        axios.post(`http://localhost:5000/meeting/check-host/`, { roomId, user_id: userId })
            .then((response) => {
                if (response.data.is_host == true) {
                    setIsHost(true)
                }
            })
    }

    const startStream = async () => {
        try {
            localStream.current = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            localVideoRef.current.srcObject = localStream.current;
            socketRef.current.emit('join-room', roomId, username, userId);
            if (!location.state.videoOn) {
                toggleVideo()
            }
            if (!location.state.micOn) {
                toggleMic()
            }
        } catch (error) {
            console.error('Error accessing media devices', error);
        }
    };

    const setupDataChannel = (channel, socketId) => {
        channel.onmessage = (event) => {
            const { message, username } = JSON.parse(event.data);
            setMessages(prevMessages => [...prevMessages, { username, content: message.content }]);
        };
        dataChannels.current[socketId] = channel;
    };

    const handleUserJoined = async (socketId) => {
        const peerConnection = createPeerConnection(socketId);
        const dataChannel = peerConnection.createDataChannel('chat');
        setupDataChannel(dataChannel, socketId);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socketRef.current.emit('offer', offer, socketId);
    };

    const handleOffer = async (offer, socketId) => {
        const peerConnection = createPeerConnection(socketId);
        peerConnection.ondatachannel = (event) => {
            setupDataChannel(event.channel, socketId);
        };
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socketRef.current.emit('answer', answer, socketId);
    };

    const handleAnswer = async (answer, socketId) => {
        const peerConnection = peerConnections.current[socketId];
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = (candidate, socketId) => {
        const peerConnection = peerConnections.current[socketId];
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleUserDisconnected = (socketId) => {
        if (peerConnections.current[socketId]) {
            peerConnections.current[socketId].close();
            delete peerConnections.current[socketId];
        }
        setPeers(prevPeers => {
            const newPeers = { ...prevPeers };
            delete newPeers[socketId];
            return newPeers;
        });
        setParticipants(prevParticipants =>
            prevParticipants.filter(participant => participant.id !== socketId)
        );
        removeRemoteStream(socketId);
    };

    const createPeerConnection = (socketId) => {
        const peerConnection = new RTCPeerConnection(config);

        localStream.current.getTracks().forEach((track) => peerConnection.addTrack(track, localStream.current));

        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            addRemoteStream(remoteStream, socketId);
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('ice-candidate', event.candidate, socketId);
            }
        };

        peerConnections.current[socketId] = peerConnection;
        return peerConnection;
    };

    const removeRemoteStream = (socketId) => {
        const videoElement = document.getElementById(`remote-video-${socketId}`);
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
        if (isHost || allow_participants_screen_share) {
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
                    if (error.name != 'NotAllowedError') {
                        console.error('Error sharing screen:', error);
                    }
                }
            } else {
                stopScreenShare();
            }
        } else {
            showToast(`Participants are not allowed to share the screen`, 'info');
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
                channel.send(JSON.stringify({ message, username }));
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

    const addRemoteStream = (stream, socketId) => {
        let videoElement = document.getElementById(`remote-video-${socketId}`);
        if (!videoElement) {
            videoElement = document.createElement('video');
            videoElement.id = `remote-video-${socketId}`;
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            videoElement.className = "w-80 h-60 rounded-lg shadow-md mb-4";
            document.getElementById('remote-videos').appendChild(videoElement);
        }
        videoElement.srcObject = stream;
    };

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // Handle the start of dragging
    const handleMouseDown = (e) => {
        setDragging(true);
        setOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    // Handle dragging movement
    const handleMouseMove = (e) => {
        if (dragging) {
            setPosition({
                x: e.clientX - offset.x,
                y: e.clientY - offset.y
            });
        }
    };

    // Handle the end of dragging
    const handleMouseUp = () => {
        setDragging(false);
    };

    return (
        <div className="h-screen w-full bg-gray-900 text-white flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-800">
                <div className="flex items-center space-x-2">
                    <div className="text-blue-500">
                        <Camera className="w-8 h-8" />
                    </div>
                    <span className="text-2xl font-semibold">VideoChat</span>
                </div>
                {isHost && (
                    <button
                        data-toggle-button="true"
                        onClick={toggleWaitingRoom}
                        className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"
                    >
                        <Clock className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div
                className="flex-grow relative bg-[#1B1F36] overflow-hidden"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div className="w-full h-full max-w-8xl max-h-6xl bg-[#1B1F36] rounded-lg p-4 flex flex-col items-center">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        onMouseDown={handleMouseDown}
                        className="w-40 h-30 sm:w-60 sm:h-40 md:w-80 md:h-60 rounded-lg shadow-md mb-4 cursor-move"
                        style={{
                            position: "absolute",
                            left: `${position.x}px`,
                            top: `${position.y}px`,
                        }}
                    />
                    <div className="overflow-x-auto">
                        <div id="remote-videos" className="flex justify-center flex-wrap gap-4 h-full overflow-y-auto p-2">
                            {/* Remote videos will be appended here */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Controls */}
            <div className="h-16 flex items-center justify-center w-full px-4 bg-gray-900">
                <div className="flex justify-center items-center space-x-4">
                    <button
                        onClick={toggleMic}
                        className={`p-3 rounded-full ${micOn ? 'bg-blue-600' : 'bg-red-600'} hover:opacity-90 transition-colors`}
                    >
                        <Mic size={24} />
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`p-3 rounded-full ${videoOn ? 'bg-blue-600' : 'bg-red-600'} hover:opacity-90 transition-colors`}
                    >
                        <Camera size={24} />
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
                        data-toggle-button="true"
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
            <div ref={sidebarRef}>
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
        </div>
    );
};

export default VideoChat;