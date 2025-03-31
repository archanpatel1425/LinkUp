const authService = require('../services/authService');
const colorArray = require('../utils/colorArray');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
    try {
        const user_data = req.body;
        if (!user_data.first_name || !user_data.last_name || !user_data.email || !user_data.password) {
            return res.status(400).json({ error: 'Required fields are missing' }); 
        }
        const randomColor = colorArray[Math.floor(Math.random() * colorArray.length)];
        user_data['profilePic'] = `https://ui-avatars.com/api/?name=${user_data['first_name']}+${user_data['last_name']}&background=${randomColor}&color=fff&size=500&font-size=0.55&uppercase=true`;
        const response = await authService.signup(user_data);
        res.status(201).json(response); 
    } catch (error) {
        console.error(error);
        if (error.message.includes('duplicate key error') || error.message.includes('email already exists')) {
            res.status(409).json({ error: 'Email already in use' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' }); 
        }
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const response = await authService.login(email, password);
        if (response) {
            res.status(200).json(response); 
        } else {
            res.status(401).json({ error: 'Invalid email or password' }); 
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' }); 
    }
};

const extractDataFromToken = (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) {
            return res.status(400).json({ error: 'Access token is required' }); 
        }
        const decodedData = jwt.verify(accessToken, process.env.JWT_SECRET);

        res.status(200).json(decodedData); 
    } catch (error) {
        console.error(error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'TokenExpiredError',
                message: 'Session expired. Please log in again to continue.',
            });
        }
        else if (error.name === 'JsonWebTokenError') {
            res.status(401).json({ error: 'Invalid Token' }); 
        } else {
            res.status(500).json({ error: 'Internal Server Error' }); 
        }
    }
};


module.exports = { signup, login, extractDataFromToken };
