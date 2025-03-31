const bcrypt = require('bcrypt');
const User = require('../models/User');
const colorArray = require('../utils/colorArray');
const meetingService = require('./meetingService');
const jwt = require('jsonwebtoken');
const {assignMeetingId}=require('./meetingService')

const generateJWT = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET);
};

const signup = async (userData) => {
    try {
        const user = new User(userData);
        user.save();
        const userId = user._id.toString()
        assignMeetingId(userId)
        const username = user['first_name'] + ' ' + user['last_name']
        const email = user.email
        const accessToken = generateJWT({ userId, email, username })
        return { message: 'User registered successfully', accessToken, userId, username, email };
    } catch (error) {
        throw new Error(`Signup error: ${error.message}`);
    }
};

const login = async (email, password) => {
    try {
        const userData = await User.findOne({ email: email, password: password });
        if (!userData) throw new Error('User not found');
        // Generate tokens, etc.
        const username = userData['first_name'] + ' ' + userData['last_name']
        const userId = userData._id.toString()
        const accessToken = generateJWT({ userId, email, username })
        return { message: 'Login successful', accessToken, userId, username };
    } catch (error) {
        throw new Error(`Login error: ${error.message}`);
    }
};

module.exports = { signup, login };
