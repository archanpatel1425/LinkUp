const { ObjectId } = require('mongodb');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const getMeetingByHostId = async (hostId) => {
    const meeting = await Meeting.findOne({ host_id: hostId });
    return meeting;
};

const getUserDetails = async (userIds) => {
    const users = await User.find({ _id: { $in: userIds.map(id => ObjectId(id)) } }, { projection: { first_name: 1, last_name: 1 } }).toArray();
    return users;
};


const checkIfHost = async (meetingId, userId) => {
    const user = await Meeting.findOne({ meeting_id: meetingId, host_id: userId });
    return Boolean(user);
};

const fetchMeetingDetail = async (hostId) => {
    const meetingData = await Meeting.findOne({ host_id: hostId });
    const userData = await db.collection('user_data').findOne({ _id: ObjectId(hostId) });
    return { meetingData, userData };
};

const generateMeetingId = () => {
    const meetingId = uuidv4().replace(/-/g, '').slice(0, 12);
    return `${meetingId.slice(0, 4)}-${meetingId.slice(4, 8)}-${meetingId.slice(8)}`;
};

const generateNewMeetingId = async (userId) => {
    try {
        const newMeetingId = generateMeetingId();
        const meetingLink = `http://localhost:5173/${newMeetingId}`;
        const result = await Meeting.updateOne(
            { host_id: userId },
            {
                $set: {
                    meeting_id: newMeetingId,
                    meeting_link: meetingLink,
                }
            }
        );

        if (result.modifiedCount === 0) {
            throw new Error('Failed to update meeting data');
        }

        return newMeetingId;
    } catch (error) {
        console.error('Error in generateNewMeetingId:', error);
        throw error;
    }
};

const assignMeetingId = async (user_id) => {
    const meetingId = generateMeetingId();
    const meeting = new Meeting({
        meeting_id: meetingId,
        host_id: user_id,
        meeting_link: `http://localhost:5173/${meetingId}`,
        controls: {
            allow_participants_screen_share: false,
            enableWaitingRoom: true
        },
        is_active: false
    });
    await meeting.save();
};

const getMeetingDetails = async (userId) => {
    try {

        const meetingData = await Meeting.findOne({ host_id: userId });

        const userData = await User.findOne({ _id: new ObjectId(userId) });

        if (!meetingData || !userData) {
            return null;
        }

        const username = `${userData.first_name} ${userData.last_name}`;
        return {
            username,
            meeting_id: meetingData.meeting_id,
            meeting_link: meetingData.meeting_link
        };
    } catch (error) {
        console.error('Error in getMeetingDetails:', error);
        throw error;
    }
};
const checkHost = async (meetingId, userId) => {
    try {
        const user = await Meeting.findOne({
            meeting_id: meetingId,
            host_id: userId
        });

        return !!user;  
    } catch (error) {
        console.error('Error in checkHost:', error);
        throw error;
    }
};

const checkMeetingId = async (meetingId) => {
    try {
        const meeting = await Meeting.findOne({ meeting_id: meetingId });
        return !!meeting;  
    } catch (error) {
        console.error('Error in checkMeetingId:', error);
        throw error;
    }
}
module.exports = {
    getMeetingByHostId,
    getUserDetails,
    checkIfHost,
    fetchMeetingDetail,
    assignMeetingId,
    getMeetingDetails,
    generateNewMeetingId,
    checkHost,
    checkMeetingId
};
