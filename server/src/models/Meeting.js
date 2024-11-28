const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
    meeting_id: {
        type: String,
        required: true,
        unique: true // Unique meeting identifier
    },
    host_id: {
        type: String,
        required: true // Reference to the user hosting the meeting
    },
    meeting_link: {
        type: String,
        required: true // Link to the meeting
    },
    controls: {
        allow_participants_screen_share: {
            type: Boolean,
            default: false // Default is set to false
        },
        enableWaitingRoom: {
            type: Boolean,
            default: true // Default is set to true
        }
    },
    is_active: {
        type: Boolean,
        default: false // Indicates if the meeting is currently active
    }
}, {
    collection: 'meeting' // Specify the collection name
});

// Export the model
module.exports = mongoose.model('Meeting', MeetingSchema);
