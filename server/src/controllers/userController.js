const userService = require("../services/userService");

async function getUserUsername(req, res) {
  try {
    const userId = req.body.user_id;
    const username = await userService.getUsername(userId);
    res.status(200).json({ username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function fetchProfilePhoto(req, res) {
  try {
    const userId = req.body.user_id;
    console.log("------------", userId)
    const profilePic = await userService.fetchProfilePhoto(userId);
    res.status(200).json({ profilePic });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function fetchSettings(req, res) {
  try {
    const meetingId = req.body.meetingId;
    console.log(meetingId, '===============')
    const controls = await userService.fetchMeetingSettings(meetingId);
    res.status(200).json({ controls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function saveSettings(req, res) {
  try {
    const userId = req.body.user_id;
    const controls = {
      allow_participants_screen_share: req.body.allowScreenShare,
      enableWaitingRoom: req.body.enableWaitingRoom,
    };
    console.log('change setting')
    console.log('change setting', userId)
    console.log('change setting', controls)

    const updatedControls = await userService.saveMeetingSettings(userId, controls);
    res.status(200).json({ controls: updatedControls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getUserUsername,
  fetchProfilePhoto,
  fetchSettings,
  saveSettings,
};
