const User = require('../models/User');
const Meeting = require('../models/Meeting');

async function getUsername(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    return `${user.first_name} ${user.last_name}`;
}

async function fetchProfilePhoto(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');
        return user.profilePic;
    }
    catch (e) {
        console.error(e)
    }
}

async function fetchMeetingSettings(meetingId) {
    const meetingData = await Meeting.findOne({ meeting_id: meetingId });
    if (!meetingData) throw new Error('Meeting not found');
    return meetingData.controls;
}

async function saveMeetingSettings(userId, controls) {
    const result = await Meeting.updateOne(
        { host_id: userId },
        {
            $set: {
                'controls.allow_participants_screen_share': controls.allow_participants_screen_share,
                'controls.enableWaitingRoom': controls.enableWaitingRoom
            }
        }
    );
    if (result.nModified === 0) throw new Error('Meeting settings not updated');
    return controls;
}

module.exports = {
    getUsername,
    fetchProfilePhoto,
    fetchMeetingSettings,
    saveMeetingSettings,
};
