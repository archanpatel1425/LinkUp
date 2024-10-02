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
  const [videoOnJoin, setVideoOnJoin] = useState(false);
  const [audioOnJoin, setAudioOnJoin] = useState(false);

  // Fetch user settings on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post('http://127.0.0.1:8000/user/fetch-settings/', { user_id });
        const { allow_participents_screen_share, video_on_join, audio_on_join } = response.data.controls;
        
        setAllowScreenShare(allow_participents_screen_share);
        setVideoOnJoin(video_on_join);
        setAudioOnJoin(audio_on_join);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchData();
  }, [user_id]);

  // Save settings to backend when toggles change
  const saveSettings = async (newSettings) => {
    try {
      await axios.post('http://127.0.0.1:8000/user/save-settings/', {
        user_id,
        allowScreenShare: newSettings.allowScreenShare,
        videoOnJoin: newSettings.videoOnJoin,
        audioOnJoin: newSettings.audioOnJoin
      });
      console.log('Settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleToggle = (settingType) => {
    const newSettings = {
      allowScreenShare,
      videoOnJoin,
      audioOnJoin
    };

    switch (settingType) {
      case 'allowScreenShare':
        newSettings.allowScreenShare = !allowScreenShare;
        setAllowScreenShare(newSettings.allowScreenShare);
        break;
      case 'videoOnJoin':
        newSettings.videoOnJoin = !videoOnJoin;
        setVideoOnJoin(newSettings.videoOnJoin);
        break;
      case 'audioOnJoin':
        newSettings.audioOnJoin = !audioOnJoin;
        setAudioOnJoin(newSettings.audioOnJoin);
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
                isChecked={allowScreenShare}
                onChange={() => handleToggle('allowScreenShare')}
              />
            </div>

            {/* Toggle for Video On While Joining */}
            <div className="flex items-center justify-between">
              <label className="text-gray-400">Video On While Joining</label>
              <Switch
                isChecked={videoOnJoin}
                onChange={() => handleToggle('videoOnJoin')}
              />
            </div>

            {/* Toggle for Audio On While Joining */}
            <div className="flex items-center justify-between">
              <label className="text-gray-400">Audio On While Joining</label>
              <Switch
                isChecked={audioOnJoin}
                onChange={() => handleToggle('audioOnJoin')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
