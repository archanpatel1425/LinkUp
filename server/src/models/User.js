const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    phone_no: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: null // Default to null if no profile picture is provided
    },
    birthDate: {
        type: Date,
        required: false
    },
    signedUpAt: {
        type: Date,
        default: Date.now // Sets the current date/time as default
    }
}, {
    collection: 'user' // Use 'user' as the collection name
});

// Export the model
module.exports = mongoose.model('User', UserSchema);
