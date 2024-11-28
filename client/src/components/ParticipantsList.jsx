import React from 'react';
import { X } from 'lucide-react';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import { MdScreenShare } from 'react-icons/md';

const ParticipantsList = ({ showParticipants, participants, onToggleParticipants }) => {
    return (
        <div className={`fixed top-0 right-0 h-full w-80 bg-gray-800 p-4 transform transition-transform duration-300 ease-in-out ${showParticipants ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Participants</h2>
                <button onClick={onToggleParticipants} className="p-1 hover:bg-gray-700 rounded-full">
                    <X size={24} />
                </button>
            </div>
            <ul className="space-y-2">
                {participants.map((participant) => (
                    <li key={participant.socketId} className="p-2 bg-gray-900 rounded-md shadow-md flex items-center justify-between">
                        <span className="font-medium">{participant.username}</span>
                        <div className="flex items-center space-x-2">
                            {participant.screenShareOn && (
                                <MdScreenShare className="text-blue-500" title="Screen Sharing On" size={20} />
                            )}
                            {participant.audioOn ? (
                                <FaMicrophone className="text-green-500" title="Audio On" size={20} />
                            ) : (
                                <FaMicrophoneSlash className="text-red-500" title="Audio Off" size={20} />
                            )}
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
    );
};

export default ParticipantsList;