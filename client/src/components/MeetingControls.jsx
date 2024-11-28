import React from 'react';
import { Camera, LogOut, MessageSquare, Mic, MonitorUp, Users, Clock } from 'lucide-react';

const MeetingControls = ({ 
    videoOn, 
    micOn, 
    isScreenSharing, 
    isHost,
    onToggleVideo, 
    onToggleMic, 
    onToggleScreenShare, 
    onToggleParticipants, 
    onToggleChat, 
    onToggleWaitingRoom,
    onLeaveMeeting 
}) => {
    return (
        <div className="h-16 flex items-center justify-center w-full px-4 bg-gray-900">
            <div className="flex justify-center items-center space-x-4">
                <button
                    onClick={onToggleVideo}
                    className={`p-3 rounded-full ${videoOn ? 'bg-blue-600' : 'bg-red-600'} hover:opacity-90 transition-colors`}
                >
                    <Camera size={24} />
                </button>
                <button
                    onClick={onToggleMic}
                    className={`p-3 rounded-full ${micOn ? 'bg-blue-600' : 'bg-red-600'} hover:opacity-90 transition-colors`}
                >
                    <Mic size={24} />
                </button>
                <button
                    onClick={onToggleScreenShare}
                    className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-700'} hover:opacity-90 transition-colors`}
                >
                    <MonitorUp size={24} />
                </button>
                <button
                    onClick={onToggleParticipants}
                    className="p-3 rounded-full bg-gray-700 hover:opacity-90 transition-colors"
                >
                    <Users size={24} />
                </button>
                <button
                    onClick={onToggleChat}
                    className="p-3 rounded-full bg-gray-700 hover:opacity-90 transition-colors"
                >
                    <MessageSquare size={24} />
                </button>
                <button
                    onClick={onLeaveMeeting}
                    className="p-3 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                >
                    <LogOut size={24} />
                </button>
            </div>
        </div>
    );
};

export default MeetingControls;