// routes/meetingRoutes.js
const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');

router.post('/getmeetingid', meetingController.getMeetingId);
router.post('/fetch-meeting-detail', meetingController.fetchMeetingDetail);
router.post('/generate-new-meetingId', meetingController.generateNewMeetingId);
router.post('/check-host', meetingController.checkHost);
router.post('/validate-meeting-id', meetingController.checkMeetingId);

// Add routes for other controller methods...

module.exports = router;
