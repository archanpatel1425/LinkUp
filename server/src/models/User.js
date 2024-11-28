const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    
    google_id: {
        type: String,
        unique: true,
        sparse: true // Allows this field to be optional (non-required unique field)
    },
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
    },
    resetToken: {
        type: String,
        default: null // Token for password reset, can be null if not set
    },
    refreshToken: {
        type: String,
        default: null // Refresh token for session management, can be null if not set
    }
}, {
    collection: 'user' // Use 'user' as the collection name
});

// Export the model
module.exports = mongoose.model('User', UserSchema);
