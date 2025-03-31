const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
    meeting_id: {
        type: String,
        required: true,
        unique: true 
    },
    host_id: {
        type: String,
        required: true
    },
    meeting_link: {
        type: String,
        required: true 
    },
    controls: {
        allow_participants_screen_share: {
            type: Boolean,
            default: false 
        },
        enableWaitingRoom: {
            type: Boolean,
            default: true 
        }
    },
    is_active: {
        type: Boolean,
        default: false 
    }
}, {
    collection: 'meeting' 
});

module.exports = mongoose.model('Meeting', MeetingSchema);
