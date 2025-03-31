// app.js
const express = require('express');

const cors = require("cors");
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const passport = require('passport');
const axios = require('axios');
const session = require('express-session');
const connectDB = require('./config/db');  // Import database connection

const meetingRoutes = require('./routes/meetingRoutes');
const userRoutes = require("./routes/userRoutes");
const authRoutes = require('./routes/authRoutes');


const app = express();

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const allowedOrigins = [
  'http://localhost:5173'
];

app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None'
  }
}));


// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Handles URL-encoded data (if needed)

app.use(express.json());  
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None'
  }
}));

app.use('/meeting', meetingRoutes);
app.use("/user", userRoutes);
app.use('/auth', authRoutes);


// Routes
app.get('/', (req, res) => {
  res.send('home page');
});

module.exports = app;
