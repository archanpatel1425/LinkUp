const meetingService = require('../services/meetingService');

const fetchMeetingDetail = async (req, res) => {
    try {
        const userId = req.body.user_id;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const meetingDetails = await meetingService.getMeetingDetails(userId);

        if (!meetingDetails) {
            return res.status(404).json({ error: 'Meeting or user not found' });
        }

        res.json(meetingDetails);
    } catch (error) {
        console.error('Error fetching meeting details:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getMeetingId = async (req, res) => {
    const userId = req.body.user_id;
    try {
        const meeting = await meetingService.getMeetingByHostId(userId);
        if (meeting) {
            return res.status(200).json({ meeting_id: meeting.meeting_id });
        } else {
            return res.status(404).json({ error: "No meeting found for this user." });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};



const generateNewMeetingId = async (req, res) => {
    try {
        const userId = req.body.user_id;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const newMeetingId = await meetingService.generateNewMeetingId(userId);

        res.json({ meeting_id: newMeetingId });
    } catch (error) {
        console.error('Error generating new meeting ID:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const checkHost = async (req, res) => {
    try {
        const { roomId, user_id } = req.body;

        if (!roomId || !user_id) {
            return res.status(400).json({ error: 'Meeting ID and User ID are required' });
        }

        const isHost = await meetingService.checkHost(roomId, user_id);

        res.json({ is_host: isHost });
    } catch (error) {
        console.error('Error checking host:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const checkMeetingId = async (req, res) => {
    try {
        const { meetingId } = req.body
        if (!meetingId) {
            return res.status(400).json({ error: 'Meeting ID is required' });
        }
        const validMeetingId = await meetingService.checkMeetingId(meetingId);
        res.json({ validMeetingId });

    } catch (error) {
        console.error('Error checking host:', error);
        res.status(500).json({ error: 'Server error' });
    }
}
module.exports = {
    getMeetingId,
    fetchMeetingDetail,
    generateNewMeetingId,
    checkHost,
    checkMeetingId
};
