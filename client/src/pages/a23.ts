import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { Camera, Clock, LogOut, MessageSquare, Mic, MonitorUp, UserPlus, Users, X } from 'lucide-react';

// const socket = io('http://localhost:5000');

const VideoChat = ({ roomId, onLeaveMeeting }) => {
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

    /* useEffect(() => {
        const handleBeforeUnload = () => {
            // Set a flag or perform some logic before the page unloads (refresh)
            window.isRefreshing = true;
        };

        const handlePopState = () => {
            // This will be called when browser navigates using back or forward buttons
            if (!window.isRefreshing) {
                navigate('/');
            }
        };

        // Listen to beforeunload to set the refreshing state
        window.addEventListener('beforeunload', handleBeforeUnload);
        // Listen to popstate to detect browser navigation
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate]); */

    useEffect(() => {
        startStream();
        return () => {
            // Cleanup function
            leaveMeeting();
        };
    }, [roomId]);

    const startStream = async () => {
        try {
            localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideoRef.current.srcObject = localStream.current;

            socket.emit('join-room', roomId);

            socket.on('user-joined', async (userId) => {
                console.log('User joined room:', userId);
                const peerConnection = createPeerConnection(userId);
                const dataChannel = peerConnection.createDataChannel('chat');
                setupDataChannel(dataChannel, userId);

                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                socket.emit('offer', offer, userId);
            });

            socket.on('offer', async (offer, userId) => {
                const peerConnection = createPeerConnection(userId);
                peerConnection.ondatachannel = (event) => {
                    setupDataChannel(event.channel, userId);
                };

                await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('answer', answer, userId);
            });

            socket.on('answer', async (answer, userId) => {
                const peerConnection = peerConnections.current[userId];
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            });

            socket.on('ice-candidate', (candidate, userId) => {
                const peerConnection = peerConnections.current[userId];
                peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            });

            socket.on('user-disconnected', (userId) => {
                handleUserDisconnected(userId);
            });
        } catch (error) {
            console.error('Error accessing media devices', error);
        }
    };

    const createPeerConnection = (userId) => {
        const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

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

    const setupDataChannel = (channel, userId) => {
        channel.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages(prevMessages => [...prevMessages, { userId, content: message.content }]);
        };
        dataChannels.current[userId] = channel;
    };

    const addRemoteStream = (stream, userId) => {
        let videoElement = document.getElementById(remote-video-${userId});
        if (!videoElement) {
            videoElement = document.createElement('video');
            videoElement.id = remote-video-${userId};
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            videoElement.style.width = '300px';
            document.getElementById('remote-videos').appendChild(videoElement);
        }
        videoElement.srcObject = stream;
    };

    const removeRemoteStream = (userId) => {
        const videoElement = document.getElementById(remote-video-${userId});
        const screenElement = document.getElementById(screen-share-${userId});

        if (videoElement) videoElement.remove();
        if (screenElement) screenElement.remove();
    };

    const handleUserDisconnected = (userId) => {
        if (peerConnections.current[userId]) {
            peerConnections.current[userId].close();
            delete peerConnections.current[userId];
        }
        if (dataChannels.current[userId]) {
            delete dataChannels.current[userId];
        }
        removeRemoteStream(userId);
        setPeers(prevPeers => {
            const newPeers = { ...prevPeers };
            delete newPeers[userId];
            return newPeers;
        });
        console.log(User ${userId} has left the meeting);
    };

    const toggleMic = () => {
        const audioTrack = localStream.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setMicOn(audioTrack.enabled);
        }
    };

    const toggleVideo = () => {
        const videoTrack = localStream.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setVideoOn(videoTrack.enabled);
        }
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
        // Notify the server that we're leaving the room
        socket.emit('leave-room', roomId);

        // Close all peer connections
        Object.values(peerConnections.current).forEach(pc => pc.close());

        // Stop all local tracks
        localStream.current.getTracks().forEach(track => track.stop());

        // Clear all state
        setPeers({});
        peerConnections.current = {};
        dataChannels.current = {};
        setMessages([]);

        // Disconnect from socket
        socket.disconnect();

        // Navigate to home page
        navigate('/home');
    };

    const startScreenShare = async () => {
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
        } catch (error) {
            console.error('Error sharing screen:', error);
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
    };

   
    return (
        <div>
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px' }} />
            <div id="remote-videos"></div>

            <div>
                <button onClick={toggleMic}>
                    {micOn ? 'Turn Mic Off' : 'Turn Mic On'}
                </button>
                <button onClick={toggleVideo}>
                    {videoOn ? 'Turn Video Off' : 'Turn Video On'}
                </button>
                <button onClick={isScreenSharing ? stopScreenShare : startScreenShare}>
                    {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                </button>
                <button onClick={leaveMeeting}>Leave Meeting</button>
            </div>

            <div>
                <div style={{ height: '200px', overflowY: 'scroll', border: '1px solid #ccc' }}>
                    {messages.map((msg, index) => (
                        <div key={index}><strong>{msg.userId}:</strong> {msg.content}</div>
                    ))}
                </div>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default VideoChat;