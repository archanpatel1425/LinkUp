import { Camera, LogOut, MessageSquare, Mic, MonitorUp, Users, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import { MdScreenShare } from 'react-icons/md';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

// const socket = io('http://localhost:5000');

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
    const location = useLocation()
    const { roomId } = useParams()
    // const { username, allow_participants_screen_share, video_on_join, audio_on_join } = location.state
    const username = "Archan"
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    }
    /*     useEffect(() => {
            const userDetails = sessionStorage.getItem('user_details');
            if (!userDetails) {
                navigate('/dashboard');
            } else {
                setIsAuthenticated(true);
            }
        }, [navigate]); */
    useEffect(() => {
        // if (!isAuthenticated) return;
        startStream();

        // Set up socket event listeners
        socket.on('room-users', (users) => {
            console.log('Received room users:', users);
            const formattedParticipants = users.map(user => ({
                username: user.username,
                id: user.id,
                videoOn: user.videoOn,
                audioOn: user.audioOn,
                screenShareOn: user.screenShareOn
            }));
            setParticipants(formattedParticipants);
        });

        socket.on('user-joined', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('user-disconnected', handleUserDisconnected);

        return () => {
            leaveMeeting();
            // Clean up socket listeners
            socket.off('room-users');
            socket.off('user-joined');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
            socket.off('user-disconnected');
        };
    }, [roomId]);

    // 2. Modify startStream to only handle media and emit join-room
    const startStream = async () => {
        try {
            localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideoRef.current.srcObject = localStream.current;
            socket.emit('join-room', roomId, username);
        } catch (error) {
            console.error('Error accessing media devices', error);
        }
    };

    const setupDataChannel = (channel, userId) => {
        channel.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages(prevMessages => [...prevMessages, { userId, content: message.content }]);
        };
        dataChannels.current[userId] = channel;
    };
    /* const startStream = async () => {
        try {
            localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideoRef.current.srcObject = localStream.current;
            socket.emit('join-room', roomId, username);
            socket.on('room-users', (users) => {
                console.log("hereeeeeeeeeeeeeeeeee")
                console.log('Received room users:', users);
                // Transform the users array to match your participants state structure
                const formattedParticipants = users.map(user => ({
                    username: user.username,
                    id: user.id,
                    videoOn: user.videoOn,
                    audioOn: user.audioOn,
                    screenShareOn: user.screenShareOn
                }));
                console.log("---- Participents ----")
                console.log(participants)
                console.log("---- formattedParticipants ----")
                console.log(formattedParticipants)
                setParticipants(formattedParticipants);
            });
            socket.on('user-joined', handleUserJoined);
            socket.on('offer', handleOffer);
            socket.on('answer', handleAnswer);
            socket.on('ice-candidate', handleIceCandidate);
            socket.on('user-disconnected', handleUserDisconnected);
        } catch (error) {
            console.error('Error accessing media devices', error);
        }
    }; */

    const handleUserJoined = async (userId) => {
        console.log('User joined room:', userId);
        const peerConnection = createPeerConnection(userId);
        const dataChannel = peerConnection.createDataChannel('chat');
        setupDataChannel(dataChannel, userId);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer, userId);
    };

    const handleOffer = async (offer, userId) => {
        const peerConnection = createPeerConnection(userId);
        peerConnection.ondatachannel = (event) => {
            setupDataChannel(event.channel, userId);
        };
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', answer, userId);
    };

    const handleAnswer = async (answer, userId) => {
        const peerConnection = peerConnections.current[userId];
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = (candidate, userId) => {
        const peerConnection = peerConnections.current[userId];
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleUserDisconnected = (userId, username) => {
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
                socket.emit('ice-candidate', event.candidate, userId);
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
            socket.emit('toggle-audio', roomId, audioTrack.enabled);
        }
    };

    const toggleVideo = () => {
        const videoTrack = localStream.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setVideoOn(videoTrack.enabled);
            socket.emit('toggle-video', roomId, videoTrack.enabled);
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
                socket.emit('toggle-screen-share', roomId, true);
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
        socket.emit('toggle-screen-share', roomId, false);
    };


    const sendMessage = () => {
        if (inputMessage.trim()) {
            const message = { content: inputMessage.trim() };
            setMessages(prevMessages => [...prevMessages, { userId: 'You', content: message.content }]);
            Object.values(dataChannels.current).forEach(channel => {
                channel.send(JSON.stringify(message));
            });
            setInputMessage('');
        }
    };

    const leaveMeeting = () => {
        if (localStream.current) {
            socket.emit('leave-room', roomId);
            Object.values(peerConnections.current).forEach(pc => pc.close());
            localStream.current.getTracks().forEach(track => track.stop());
            socket.disconnect();
        }
        sessionStorage.removeItem('user_details')
        navigate('/dashboard');
        // window.location.reload()
    };

    const toggleParticipants = () => {
        setShowParticipants(!showParticipants);
        setShowChat(false);
    };

    const toggleChat = () => {
        setShowChat(!showChat);
        setShowParticipants(false);
    };

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
                    {participants.map((participant, index) => (
                        <li key={index} className="p-2 bg-gray-900 rounded-md shadow-md flex items-center justify-between">
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
                                <p><strong>{msg.userId}:</strong> {msg.content}</p>
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
        </div>
    );
};

export default VideoChat;