import axios from 'axios';
import { Camera, Clock, LogOut, MessageSquare, Mic, MonitorUp, UserPlus, Users, X } from 'lucide-react';
import React, { useContext, useEffect, useRef, useState } from "react";
import { FaVideo } from 'react-icons/fa'; // Import an appropriate icon (video for Zoom)
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/Toast'; // Ad
import { AuthContext } from "../helpers/AuthContext";

// const socket = io("http://localhost:5000");

function MeetingPage() {
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [otherUsers, setOtherUsers] = useState([]);
  const [peerConnections, setPeerConnections] = useState({});
  const [screenStream, setScreenStream] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [waitingRoomUsers, setWaitingRoomUsers] = useState([]);
  const localVideoRef = useRef(null);
  const location = useLocation();
  const { room } = useParams()
  const { username, allow_participants_screen_share, video_on_join, audio_on_join } = location.state
  const { authState } = useContext(AuthContext);
  const [ScreenSharepermission, setScreenSharePermission] = useState(true)
  const { showToast } = useToast();
  const [peers, setPeers] = useState({});
  const localStream = useRef(null);
  const navigate = useNavigate()
  const config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  };

  useEffect(() => {
    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user-joined', async (userId) => {
      console.log('User joined room:', userId);

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      // Add local stream tracks to peer connection
      localStream.current.getTracks().forEach((track) => peerConnection.addTrack(track, localStream.current));

      // Listen for remote stream
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        addRemoteStream(remoteStream, userId);
      };

      // ICE Candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', event.candidate, userId);
        }
      };

      peerConnections.current[userId] = peerConnection;

      // Create an offer and send it to the newly joined user
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', offer, userId);
    });

    socket.on("currentUsers", (users) => {
      setOtherUsers(users);
      users.forEach(userId => {
        socket.emit("requestUserStatus", { to: userId, from: socket.id });
      });
    });

    socket.on("userLeft", (userId) => {
      setOtherUsers(prev => prev.filter(id => id !== userId));
      const peerConnection = peerConnections[userId];
      if (peerConnection) {
        peerConnection.close();
        setPeerConnections(prev => {
          const newConnections = { ...prev };
          delete newConnections[userId];
          return newConnections;
        });
      }
      const remoteVideo = document.getElementById(`remote-video-${userId}`);
      if (remoteVideo) {
        remoteVideo.remove();
      }
    });

    socket.on("userStatus", async ({ from, isCameraOn }) => {
      if (isCameraOn) {
        await createPeerConnection(from);
        socket.emit("requestOffer", { to: from, from: socket.id });
      }
    });

    /*     socket.on("offer", async (userId, description) => {
          let peerConnection = peerConnections[userId];
          if (!peerConnection) {
            peerConnection = await createPeerConnection(userId);
          }
          await peerConnection.setRemoteDescription(description);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit("answer", userId, answer);
        }); */
    socket.on('offer', async (offer, userId) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      // Add local stream tracks to peer connection
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

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', answer, userId);

      peerConnections.current[userId] = peerConnection;
    });


    socket.on('answer', async (userId, description) => {
      const peerConnection = peerConnections.current[userId];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
      }
    });

    /*  socket.on("answer", async (userId, description) => {
       const peerConnection = peerConnections[userId];
       if (peerConnection) {
         await peerConnection.setRemoteDescription(description);
       }
     }); */

    socket.on('candidate', (userId, candidate) => {
      const peerConnection = peerConnections.current[userId];
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    /* socket.on("candidate", async (userId, candidate) => {
      const peerConnection = peerConnections[userId];
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
 */
    socket.on("cameraStatusChange", async ({ userId, isOn }) => {
      if (isOn) {
        if (!peerConnections[userId]) {
          await createPeerConnection(userId);
        }
        socket.emit("requestOffer", { to: userId, from: socket.id });
      } else {
        const remoteVideo = document.getElementById(`remote-video-${userId}`);
        if (remoteVideo) {
          remoteVideo.srcObject = null;
        }
      }
    });

    socket.on("micStatusChange", async ({ userId, isOn }) => {
      if (isOn) {
        socket.emit("requestOffer", { to: userId, from: socket.id });
      }
    });

    socket.on("screenShare", async ({ userId, isSharing }) => {
      if (isSharing) {
        socket.emit("requestOffer", { to: userId, from: socket.id });
      } else {
        const remoteVideo = document.getElementById(`remote-video-${userId}`);
        if (remoteVideo && remoteVideo.srcObject) {
          remoteVideo.srcObject.getTracks().forEach(track => track.stop());
          remoteVideo.srcObject = null;
        }
      }
    });

    socket.on("requestOffer", async ({ from }) => {
      let peerConnection = peerConnections[from];
      if (!peerConnection) {
        peerConnection = await createPeerConnection(from);
      }
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("offer", from, offer);
    });


    socket.on("participantList", (list) => {
      (list);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("cameraStatusChange");
      socket.off("requestOffer");
      socket.off("currentUsers");
      socket.off("userLeft");
      socket.off("userStatus");
      socket.off("screenShare");
      socket.off("participantList");
      socket.off("micStatusChange");
      socket.off("requestAudioOffer");
      socket.off("audioOffer");
      socket.off("audioAnswer");
    };
  }, [isCameraOn, isMicOn, room, peerConnections]);

  useEffect(() => {
    createPeerConnection()
    check_is_host()
    const interval = setInterval(fetchUpdates, 1000);
    return () => clearInterval(interval);

  }, []);
  const check_is_host = () => {
    axios.post(`http://localhost:5000/meeting/check_host/`, { room, user_id: authState.user_id })
      .then((response) => {
        if (response.data.is_host == true) {
          setIsHost(true)
        }
      })
  }
  const createPeerConnection = async () => {
    try {
      // Get local stream (audio and video)
      localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = localStream.current;

      // Emit join-room with room ID
      socket.emit('join-room', roomId);

      // Listen for other users joining the room
      socket.on('user-joined', async (userId) => {
        console.log('User joined room:', userId);

        // Create peer connection
        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        // Add local stream tracks to peer connection
        localStream.current.getTracks().forEach((track) => peerConnection.addTrack(track, localStream.current));

        // Listen for remote stream
        peerConnection.ontrack = (event) => {
          const [remoteStream] = event.streams;
          addRemoteStream(remoteStream, userId);
        };

        // ICE Candidate handling
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', event.candidate, userId);
          }
        };

        peerConnections.current[userId] = peerConnection;

        // Create an offer and send it to the newly joined user
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer, userId);
      });

      // Handle incoming offer
      /* socket.on('offer', async (offer, userId) => {
        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        // Add local stream tracks to peer connection
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

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', answer, userId);

        peerConnections.current[userId] = peerConnection;
      });

      // Handle incoming answer
      socket.on('answer', async (answer, userId) => {
        const peerConnection = peerConnections.current[userId];
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      });

      // Handle incoming ICE candidates
      socket.on('ice-candidate', (candidate, userId) => {
        const peerConnection = peerConnections.current[userId];
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });

      // Handle when a user disconnects
      socket.on('user-disconnected', (userId) => {
        if (peerConnections.current[userId]) {
          peerConnections.current[userId].close();
          delete peerConnections.current[userId];
          removeRemoteStream(userId);
        }
      });*/
    } catch (error) {
      console.error('Error accessing media devices', error);
    }
  };
  const leaveMeeting = () => {
    // Close all peer connections
    Object.values(peerConnections).forEach(pc => pc.close());
    setPeerConnections({});

    // Stop all local tracks
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    // Emit leave room event
    socket.emit("leaveRoom", { room, username });

    // Disconnect socket
    socket.disconnect();

    // Navigate to /afterlogin
  };


  /*   const createPeerConnection = async (userId) => {
      const peerConnection = new RTCPeerConnection(config);
  
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("candidate", userId, event.candidate);
        }
      };
  
      peerConnection.ontrack = (event) => {
        let remoteVideo = document.getElementById(`remote-video-${userId}`);
        if (!remoteVideo) {
          remoteVideo = document.createElement('video');
          remoteVideo.id = `remote-video-${userId}`;
          remoteVideo.autoplay = true;
          remoteVideo.playsInline = true;
          remoteVideo.className = "w-80 h-60 rounded-lg";
          document.getElementById('remote-videos').appendChild(remoteVideo);
        }
        remoteVideo.srcObject = event.streams[0];
      };
  
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => {
          peerConnection.addTrack(track, localVideoRef.current.srcObject);
        });
      }
  
      setPeerConnections(prev => ({ ...prev, [userId]: peerConnection }));
      return peerConnection;
    };
  */
  const joinRoom = () => {
    socket.emit("joinRoom", { room, username });
    setIsInRoom(true)
  };

  const addRemoteStream = (stream, userId) => {
    if (stream.getVideoTracks()[0].label.includes('screen')) {
      handleIncomingScreenShare(stream, userId);
      return;
    }

    // Existing video handling code
    let videoElement = document.getElementById(`remote-video-${userId}`);
    if (!videoElement) {
      videoElement = document.createElement('video');
      videoElement.id = `remote-video-${userId}`;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.style.width = '300px';
      document.getElementById('remote-videos').appendChild(videoElement);
    }
    videoElement.srcObject = stream;
  };
  /* const createPeerConnection = async () => {
    try {
      // Get local stream (audio and video)
      localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = localStream.current;
  
      // Emit join-room with room ID
      socket.emit('join-room', roomId);
  
      // Handle new peer connections when a user jo ins
      const handleNewPeer = async (userId) => {
        console.log('User joined room:', userId);
  
        // Create peer connection
        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
  
        // Add local stream tracks to peer connection
        localStream.current.getTracks().forEach((track) => peerConnection.addTrack(track, localStream.current));
  
        // Listen for remote stream
        peerConnection.ontrack = (event) => {
          const [remoteStream] = event.streams;
          let remoteVideo = document.getElementById(`remote-video-${userId}`);
          if (!remoteVideo) {
            remoteVideo = document.createElement('video');
            remoteVideo.id = `remote-video-${userId}`;
            remoteVideo.autoplay = true;
            remoteVideo.playsInline = true;
            document.getElementById('remote-videos').appendChild(remoteVideo);
          }
          remoteVideo.srcObject = remoteStream;
        };
  
        // ICE Candidate handling
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', { to: userId, candidate: event.candidate });
          }
        };
  
        peerConnections.current[userId] = peerConnection;
  
        // Create an offer and send it to the newly joined user
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer, userId);
      };
  
      // Listen for other users joining the room
      socket.on('user-joined', (userId) => {
        handleNewPeer(userId);
      });
  
    } catch (error) {
      console.error('Error accessing media devices', error);
    }
  }; */


  const updateStreamTracks = async (constraints) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Stop old tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      localStreamRef.current = newStream;

      // Update local video element
      const localVideo = document.getElementById('local-video');
      if (localVideo) {
        localVideo.srcObject = newStream;
      }

      // Update all peer connections with new tracks
      Object.values(peerConnections.current).forEach(pc => {
        newStream.getTracks().forEach(track => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            pc.addTrack(track, newStream);
          }
        });
      });

      return newStream;
    } catch (error) {
      console.error("Error updating media streams:", error);
      throw error;
    }
  };

  const toggleMic = () => {
    const audioTrack = localStream.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    const videoTrack = localStream.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  };

  const sendMessage = () => {
    const data = {
      user: username,
      message,
      room,
      timestamp: new Date()
    };
    socket.emit("sendMessage", data);
    setMessage("");
  };

  /*   const toggleCamera = async () => {
      if (!isCameraOn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true});
          localVideoRef.current.srcObject = stream;
          setIsCameraOn(true);
  
          Object.values(peerConnections).forEach(pc => {
            stream.getTracks().forEach(track => {
              pc.addTrack(track, stream);
            });
          });
  
          socket.emit("cameraStatusChange", { room, isOn: true });
        } catch (error) {
          console.error("Error accessing camera:", error);
        }
      } else {
        const stream = localVideoRef.current.srcObject;
        const tracks = stream.getTracks().filter(track => track.kind === 'video');
        tracks.forEach(track => track.stop());
        setIsCameraOn(false);
  
        socket.emit("cameraStatusChange", { room, isOn: false });
      }
    };
  
    const toggleMic = async () => {
      if (!isMicOn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsMicOn(true);
  
          Object.values(peerConnections).forEach(pc => {
            stream.getTracks().forEach(track => {
              pc.addTrack(track, stream);
            });
          });
  
          socket.emit("startSharing", room);
        } catch (error) {
          console.error("Error accessing microphone:", error);
        }
      } else {
        const stream = localVideoRef.current.srcObject;
        if (stream) {
          const tracks = stream.getTracks().filter(track => track.kind === 'audio');
          tracks.forEach(track => track.stop());
        }
        setIsMicOn(false);
      }
    } */


  const toggleScreenShare = async () => {
    if (isHost || allow_participants_screen_share) {
      if (!isScreenSharing) {
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          setScreenStream(stream);
          localVideoRef.current.srcObject = stream;
          setIsScreenSharing(true);

          Object.values(peerConnections).forEach(pc => {
            stream.getTracks().forEach(track => {
              pc.addTrack(track, stream);
            });
          });

          socket.emit("screenShare", { room, isSharing: true });

          stream.getVideoTracks()[0].onended = () => {
            stopScreenSharing();
          };
        } catch (error) {
          console.error("Error sharing screen:", error);
        }
      } else {
        stopScreenSharing();
      }
    }
    else {
      showToast(`Praticipent are not allowed to share the screen`, 'info');
    }
  };

  const stopScreenSharing = async () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    if (localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    localVideoRef.current.srcObject = null;
    setIsScreenSharing(false);
    socket.emit("screenShare", { room, isSharing: false });

    // Restore camera if it was on
    if (isCameraOn) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn })
      localVideoRef.current.srcObject = stream;
      Object.values(peerConnections).forEach(pc => {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      });
      socket.emit("cameraStatusChange", { room, isOn: true });
    }
  }
  const toggleWaitingRoom = () => {
    setShowWaitingRoom(!showWaitingRoom);
  };
  const admitUser = async (userId) => {
    try {
      await axios.post('http://localhost:5000/meeting/admit-user/', { room, userId });
      fetchUpdates(); // Refresh the waiting room list
    } catch (error) {
      console.error("Error admitting user:", error);
    }
  };
  const fetchUpdates = async () => {
    try {
      axios.post(`http://localhost:5000/meeting/room-updates/`, { meeting_id: room })
        .then((response) => {
          setWaitingRoomUsers(response.data.waiting_room_list);
        })
      // Handle other updates as needed
    } catch (error) {
      console.error("Error fetching updates:", error);
    }
  };
  const toggleParticipantList = () => {
    if (showParticipants == false) {
      setShowChat(false)
      setShowWaitingRoom(false)
    }
    setShowParticipants(!showParticipants);
    if (showParticipants) {
      socket.emit("getParticipants", room);
    }
  }
  const toggleChat = () => {
    if (showChat == false) {
      setShowParticipants(false)
      setShowWaitingRoom(false)
    }
    setShowChat(!showChat);
  }

  /*   const toggleWaitingRoom = () => setShowWaitingRoom(!showWaitingRoom); */
  return (
    <div className="flex flex-col h-screen w-full bg-gray-900 text-white">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 py-2">
        <div className="flex items-center space-x-2">
          <div className="text-blue-500 w-8 h-8">
            <FaVideo className="w-full h-full m-1" />
          </div>
          <span className="text-3xl font-semibold p-2 ">Linkup</span>
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
            id="local-video"
            autoPlay
            playsInline
            muted
            className="w-80 h-60 rounded-lg shadow-md mb-4 fixed bottom-20 right-8"
          />

          <div className="overflow-x-auto">
            <div className="flex justify-center flex-wrap gap-4" id="remote-videos">
              {/* Remote videos will be appended here */}
            </div>
          </div>

        </div>
      </div>

      {/* Footer Controls */}
      <div className="h-16 flex items-center justify-center w-full px-4 bg-gray-900">
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={toggleCamera}
            className={`p-3 rounded-full ${isCameraOn ? 'bg-blue-600' : 'bg-red-600'} hover:opacity-90 transition-colors`}
          >
            <Camera size={24} />
          </button>
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full ${isMicOn ? 'bg-blue-600' : 'bg-red-600'} hover:opacity-90 transition-colors`}
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
            onClick={toggleParticipantList}
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
          <button onClick={toggleParticipantList} className="p-1 hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>
        <ul className="space-y-2">
          {participants.map((participant, index) => (
            <li key={index} className="p-2 bg-gray-900 rounded-md shadow-md">
              <span className="font-medium">{participant}</span>
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
                <p><strong>{msg.user}:</strong> {msg.message}</p>
                <p className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-grow p-2 bg-gray-700 rounded-l"
              placeholder="Type a message..."
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
            {waitingRoomUsers.map((user) => (
              <li key={user.user_id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                <span>{user.username}</span>
                <button
                  onClick={() => admitUser(user.user_id)}
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
}

export default MeetingPage;