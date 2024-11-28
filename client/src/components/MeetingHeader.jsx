import React from 'react';
import { Camera, Clock } from 'lucide-react';

const MeetingHeader = ({ isHost, onToggleWaitingRoom }) => {
    return (
        <div className="h-16 flex items-center justify-between px-6 py-2">
            <div className="flex items-center space-x-2">
                <div className="text-blue-500 w-8 h-8">
                    <Camera className="w-full h-full m-1" />
                </div>
                <span className="text-3xl font-semibold p-2">VideoChat</span>
            </div>
            {isHost && (
                <button
                    onClick={onToggleWaitingRoom}
                    className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
                >
                    <Clock size={24} />
                </button>
            )}
        </div>
    );
};

export default MeetingHeader;