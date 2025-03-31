import axios from 'axios';
import { Copy } from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';

import { useToast } from './Toast'; // Ad
import { AuthContext } from "../helpers/AuthContext";
const PersonalRoom = () => {
  const [inviteLink, setInviteLink] = useState('');
  const [meetingID, setMeetingID] = useState('');
  const [topic, setTopic] = useState('');
  const { authState } = useContext(AuthContext);
  const user_id = authState.user_id;
  const { showToast } = useToast();

  useEffect(() => {
    fetch_meeting_details();
  }, [meetingID, inviteLink]);

  const fetch_meeting_details = () => {
    axios.post("http://localhost:5000/meeting/fetch-meeting-detail", { user_id })
      .then((response) => {
        setTopic(`${response.data.username}'s Personal Meeting Room`);
        setMeetingID(response.data.meeting_id);
        setInviteLink(response.data.meeting_link);
      })
      .catch((error) => {
        console.error('Error fetching meeting details:', error);
      });
  };

  // Function to copy the invite link to the clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      showToast('Meeting Link copied', 'info');
    }).catch(err => {
      console.error('Failed to copy link: ', err);
    });
  };

  // Function to copy the meeting ID to the clipboard
  const handleCopyMeetingID = () => {
    navigator.clipboard.writeText(meetingID).then(() => {
      showToast('Meeting Id copied', 'info');
    }).catch(err => {
      console.error('Failed to copy meeting ID: ', err);
    });
  };

  // Function to copy the full meeting invitation (Topic, Meeting ID, Invite Link)
  const handleCopyInvitation = () => {
    const invitationText = `Topic: ${topic}\nMeeting ID: ${meetingID}\nInvite Link: ${inviteLink}`;
    navigator.clipboard.writeText(invitationText).then(() => {
      showToast('Meeting Invitation copied', 'info');
    }).catch(err => {
      console.error('Failed to copy invitation: ', err);
    });
  };

  // Function to generate a new Meeting ID (can be from API or random generation)
  const generateNewMeetingID = () => {
    axios.post("http://localhost:5000/meeting/generate-new-meetingId", { user_id })
      .then((response) => {
        setMeetingID(response.data.meeting_id);
      })
      .catch((error) => {
        console.error('Error fetching meeting details:', error);
      });
  };

  return (
    <>
      <div className="flex min-h-screen bg-gray-900 text-white">
        <div className="flex-1 p-4 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Personal Meeting Room</h1>
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <p className="text-gray-400 mb-1 sm:mb-0 sm:w-1/4 sm:mr-4">Topic:</p>
                <p className="sm:flex-1">{topic}</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <p className="text-gray-400 mb-1 sm:mb-0 sm:w-1/4 sm:mr-4">Meeting ID:</p>
                <p className="sm:flex-1">{meetingID}</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <p className="text-gray-400 mb-1 sm:mb-0 sm:w-1/4 sm:mr-4">Invite Link:</p>
                <p className="text-blue-400 truncate sm:flex-1">{inviteLink}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                className="bg-gray-700 text-white px-4 py-2 rounded flex items-center justify-center"
                onClick={handleCopyLink}
              >
                <Copy size={18} className="mr-2" />
                Copy Meeting Link
              </button>
              <button
                className="bg-gray-700 text-white px-4 py-2 rounded flex items-center justify-center"
                onClick={handleCopyMeetingID}
              >
                <Copy size={18} className="mr-2" />
                Copy Meeting ID
              </button>
              <button
                className="bg-gray-700 text-white px-4 py-2 rounded flex items-center justify-center"
                onClick={handleCopyInvitation}
              >
                <Copy size={18} className="mr-2" />
                Copy Meeting Invitation
              </button>
              <button
                className="bg-gray-700 text-white px-4 py-2 rounded flex items-center justify-center"
                onClick={generateNewMeetingID} // Generate new Meeting ID
              >
                Generate New Meeting ID
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PersonalRoom;
