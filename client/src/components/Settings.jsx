import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../helpers/AuthContext';

const Switch = ({ isChecked, onChange }) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  );
};

const Settings = () => {
  const { authState } = useContext(AuthContext);
  const user_id = authState.user_id;

  const [allowScreenShare, setAllowScreenShare] = useState(false);
  const [enableWaitingRoom, setEnableWaitingRoom] = useState(false);

  // Fetch user settings on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await axios.post('http://localhost:5000/meeting/getmeetingid/', { user_id })
          .then(async (response) => {
            const meetingId = response.data.meeting_id;
            console.log('user_id:', user_id)
            console.log('meeting_id:', meetingId)
            await axios.post('http://localhost:5000/user/fetch-settings/', { meetingId })
              .then((response) => {
                const { allow_participants_screen_share, enableWaitingRoom } = response.data.controls;
                console.log(response.data.controls)
                setAllowScreenShare(allow_participants_screen_share);
                setEnableWaitingRoom(enableWaitingRoom);
              })


          })
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchData();
  }, [user_id]);

  // Save settings to backend when toggles change
  const saveSettings = async (newSettings) => {
    try {
      await axios.post('http://localhost:5000/user/save-settings/', {
        user_id,
        allowScreenShare: newSettings.allowScreenShare,
        enableWaitingRoom: newSettings.enableWaitingRoom
      });
      console.log('Settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleToggle = (settingType) => {
    const newSettings = {
      allowScreenShare,
      enableWaitingRoom,
    };

    switch (settingType) {
      case 'allowScreenShare':
        newSettings.allowScreenShare = !allowScreenShare;
        setAllowScreenShare(newSettings.allowScreenShare);
        break;
      case 'enableWaitingRoom':
        newSettings.enableWaitingRoom = !enableWaitingRoom;
        setEnableWaitingRoom(newSettings.enableWaitingRoom);
        break;
      default:
        break;
    }

    // Call the save function after setting state
    saveSettings(newSettings);
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div className="flex-1 p-4 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Meeting Settings</h1>
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
          <div className="space-y-6">
            {/* Toggle for Allow Screen Share */}
            <div className="flex items-center justify-between">
              <label className="text-gray-400">Allow Participants for Screen Share</label>
              <Switch
                isChecked={!!allowScreenShare}
                onChange={() => handleToggle('allowScreenShare')}
              />
            </div>

            {/* Toggle for Video On While Joining */}
            <div className="flex items-center justify-between">
              <label className="text-gray-400">Enable waiting room</label>
              <Switch
                isChecked={!!enableWaitingRoom}
                onChange={() => handleToggle('enableWaitingRoom')}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
